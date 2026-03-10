import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import sqlite3, { Database } from 'better-sqlite3';

import type { Group, Message } from '../../moneysplit-common';
import { serialize, deserialize } from '../../moneysplit-common';

export interface GroupState {
  group: Group;
  clients: Set<WebSocket>;
}

interface DatabaseEntry {
  content: string
}

export class GroupManager {
  private groups = new Map<string, GroupState>();
  private db: Database

  constructor() {
    this.db = sqlite3('data/db.sqlite');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        token TEXT PRIMARY KEY,
        content TEXT NOT NULL
      );
    `);
  }

  createGroup(): string {
    const token = randomUUID();

    const group: Group = {
      name: 'Group split',
      nextId: 0,
      people: [],
      transactions: [],
    };

    this.groups.set(token, { group, clients: new Set() });

    this.db
      .prepare<[string, string]>('INSERT INTO groups (token, content) VALUES (?, ?);')
      .run(token, JSON.stringify(serialize(group)));

    return token;
  }

  getGroup(token: string): GroupState | undefined {
    const existing = this.groups.get(token);
    if (existing) return existing;

    const persisted = this.db
      .prepare<[string], DatabaseEntry>('SELECT * FROM groups WHERE token = ?;')
      .get(token);

    if (persisted) {
      const group: Group = deserialize(JSON.parse(persisted['content']));
      this.groups.set(token, { group, clients: new Set() });
    }

    return this.groups.get(token);
  }

  addClient(token: string, ws: WebSocket): boolean {
    const state = this.groups.get(token);
    if (!state) return false;

    state.clients.add(ws);

    const initMessage: Message = {
      type: 'init',
      token,
      data: state.group,
    };

    ws.send(JSON.stringify(serialize(initMessage)));
    return true;
  }

  removeClient(token: string, ws: WebSocket) {
    const state = this.groups.get(token);
    if (!state) return;

    state.clients.delete(ws);
  }

  handleMessage(token: string, ws: WebSocket, raw: string) {
    const state = this.groups.get(token);
    if (!state) return;

    const message = deserialize(JSON.parse(raw)) as Message;

    if (message.type !== 'apply') return;

    try {
      // Apply the operation to the server's in-memory state
      message.op.impl(state.group, ...message.args);

      this.db
        .prepare<[string, string]>('UPDATE groups SET content = ? WHERE token = ?;')
        .run(JSON.stringify(serialize(state.group)), token);

      // Broadcast to all clients (including sender)
      for (const client of state.clients) {
        client.send(raw);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
