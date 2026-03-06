import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';
import type { Group, Message } from '../../moneysplit-common';
import { serialize, deserialize } from '../../moneysplit-common';

export interface GroupState {
  group: Group;
  clients: Set<WebSocket>;
}

export class GroupManager {
  private groups = new Map<string, GroupState>();

  createGroup(): string {
    const token = randomUUID();

    const group: Group = {
      name: 'Group split',
      nextId: 0,
      people: [],
      transactions: [],
    };

    this.groups.set(token, { group, clients: new Set() });
    return token;
  }

  getGroup(token: string): GroupState | undefined {
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

      // Broadcast to all clients (including sender)
      for (const client of state.clients) {
        client.send(raw);
      }
    } catch(e) {
      console.error(e);
    }
  }
}
