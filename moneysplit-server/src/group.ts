import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import type { WebSocket } from 'ws';
import sqlite3, { Database } from 'better-sqlite3';

import { serialize, deserialize, operations, assert, type Group, type Message, newGroup, doMigrations, CURRENT_VERSION } from 'moneysplit-common';

export interface GroupState {
  group: Group;
  clients: Set<WebSocket>;
}

interface DatabaseEntry {
  token: string;
  version: number;
  content: string
}

interface Metadata {
  version?: number;
}

const DATABASE_FILE = 'data/db.sqlite';
const METADATA_FILE = 'data/metadata.json';

function loadMetadata(): Metadata {
  try {
    const raw = readFileSync(METADATA_FILE, 'utf8');
    return deserialize(JSON.parse(raw));
  } catch {
    return {};
  }
}

function saveMetadata(value: Metadata) {
  writeFileSync(METADATA_FILE, JSON.stringify(serialize(value)), 'utf8');
}

export class GroupManager {
  private groups = new Map<string, GroupInstance>();
  private db: Database;

  constructor(
  ) {
    this.db = sqlite3(DATABASE_FILE);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        token TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        content TEXT NOT NULL
      );
    `);

    const metadata = loadMetadata();

    if (metadata.version !== CURRENT_VERSION) {
      console.log(`running migration ${metadata.version} -> ${CURRENT_VERSION}`);

      while (true) {
        const batch = this.db
          .prepare<[number], DatabaseEntry>('SELECT * FROM groups WHERE version != ? LIMIT 1000;')
          .all(CURRENT_VERSION);

        if (batch.length == 0) break;

        for (const entry of batch) {
          const group: Group = deserialize(JSON.parse(entry['content']));

          if (Array.isArray(group)) {
            // legacy clean up
            this.db
              .prepare<[string], DatabaseEntry>('DELETE FROM groups WHERE token = ?;')
              .run(entry['token']);
          } else {
            doMigrations(entry['version'] ?? 0, group);

            this.save(entry['token'], group);
          }
        }
      }

      metadata.version = CURRENT_VERSION;
      saveMetadata(metadata);
    }
  }

  createGroup(): GroupInstance {
    const token = randomUUID();
    const group = newGroup();

    const instance = new GroupInstance(this, token, group, new Set());

    this.db
      .prepare<[string, number, string]>('INSERT INTO groups (token, version, content) VALUES (?, ?, ?);')
      .run(token, CURRENT_VERSION, JSON.stringify(serialize(group)));

    this.groups.set(token, instance);

    return instance;
  }

  findGroup(token: string): GroupInstance | null {
    const existing = this.groups.get(token);
    if (existing !== undefined) return existing;

    const persisted = this.db
      .prepare<[string], DatabaseEntry>('SELECT * FROM groups WHERE token = ?;')
      .get(token);

    if (persisted !== undefined) {
      assert(persisted['version'] === CURRENT_VERSION, 'invalid load');

      const group: Group = deserialize(JSON.parse(persisted['content']));

      const instance = new GroupInstance(this, token, group, new Set());

      this.groups.set(token, instance);
    }

    return this.groups.get(token) ?? null;
  }

  save(token: string, group: Group) {
    this.db
      .prepare<[string, number, string]>('UPDATE groups SET content = ?, version = ? WHERE token = ?;')
      .run(JSON.stringify(serialize(group)), CURRENT_VERSION, token);
  }
}

export class GroupInstance {
  constructor(
    readonly manager: GroupManager,
    readonly token: string,
    readonly group: Group,
    readonly clients: Set<Connection>,
  ) { }

  addClient(socket: WebSocket) {
    const connection = new Connection(this, socket);

    this.clients.add(connection);

    const initMessage: Message = {
      type: 'init',
      token: this.token,
      group: this.group,
    };

    socket.send(JSON.stringify(serialize(initMessage)));
  }

  removeClient(connection: Connection) {
    this.clients.delete(connection);
  }

  handleMessage(raw: string) {
    const message = deserialize(JSON.parse(raw)) as Message;

    assert(message.type === 'apply', 'invalid message type');

    try {
      const op = operations.get(message.op);
      assert(op !== undefined, 'unknown operation');

      op.impl(this.group, ...message.args);

      this.manager.save(this.token, this.group);

      for (const client of this.clients) {
        client.send(raw);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

class Connection {
  constructor(
    readonly instance: GroupInstance,
    readonly socket: WebSocket,
  ) {
    socket.on('message', async (data) => {
      await appendFile('data/log.txt', `${instance.token} ${data.toString()}\n`);

      instance.handleMessage(data.toString());
    });

    socket.on('close', () => {
      instance.removeClient(this);
    });

    socket.on('error', (err) => {
      console.error(`WebSocket error in group ${instance.token}:`, err);
      instance.removeClient(this);
    });
  }

  send(raw: string) {
    this.socket.send(raw);
  }
}
