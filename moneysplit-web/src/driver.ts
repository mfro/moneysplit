import { reactive, watchEffect } from 'vue';
import { assert, clone, delay, deserialize, operations, serialize, UPDATE_TRANSACTION, type Group, type Message, type Operation } from '../../moneysplit-common';
import { putKnownGroup } from './localStorage';

export interface State {
  isConnecting: boolean;
  isConnected: boolean;

  isPendingSync: boolean;

  token: string | null
  data: Group | null;
}

export interface Driver {
  readonly state: State;

  apply<A extends unknown[]>(op: Operation<A>, ...args: A): void;
  close(): void;
}

interface QueueEntry {
  op: Operation<any>,
  args: unknown[],
  beforeState: Group,
}

function isExpected(entry: QueueEntry, op: Operation<any>, args: unknown[]) {
  return op == entry.op
    && JSON.stringify(serialize(args)) == JSON.stringify(serialize(entry.args));
}

export class WebSocketDriver implements Driver {
  readonly queue: QueueEntry[] = [];

  constructor(
    readonly state: State,
    readonly ws: WebSocket,
  ) {
    ws.addEventListener('close', () => {
      state.isConnected = false;
      state.isConnecting = false;
    });

    ws.addEventListener('error', async (e) => {
      console.error(e);
      await delay(1000);
      location.reload();
    });

    ws.addEventListener('open', () => {
      state.isConnected = true;
      state.isConnecting = false;

      watchEffect(() => {
        if (state.token != null && state.data != null) {
          putKnownGroup(state.token, state.data.name);
        }
      });
    });

    ws.addEventListener('message', (e) => {
      const message = deserialize(JSON.parse(e.data)) as Message;

      if (message.type == 'init') {
        state.data = message.data;
        state.token = message.token;
      } else if (message.type == 'apply') {
        assert(state.data != null, 'invalid apply');

        const op = typeof message.op == 'string'
          ? operations.get(message.op)
          : message.op;

        assert(op != null, 'unknown operation');

        const next = this.queue.shift();
        if (next) {
          if (!isExpected(next, op, message.args)) {
            console.error(`desync detected! rolling back queue of ${this.queue.length + 1} changes`);

            this.queue.length = 0;
            state.data = next.beforeState;

            op.impl(state.data, ...message.args);
          }
        } else {
          op.impl(state.data, ...message.args);
        }

        state.isPendingSync = this.queue.length > 0;
      }
    });
  }

  static connect(path: string) {
    const base = localStorage.getItem('mfro:moneysplit:server') ?? 'wss://api.mfro.me/moneysplit/';
    const url = new URL(path, base);

    const ws = new WebSocket(url);

    const state: State = reactive({
      isConnecting: true,
      isConnected: false,
      isPendingSync: false,

      token: null,
      data: null,
    });

    return new WebSocketDriver(state, ws);
  }

  apply<A extends unknown[]>(op: Operation<A>, ...args: A) {
    assert(this.state.data != null, 'invalid apply');

    const beforeState = clone(this.state.data);
    this.queue.push({
      beforeState,
      op, args,
    });
    this.state.isPendingSync = this.queue.length > 0;

    op.impl(this.state.data, ...args);

    const message: Message = {
      type: 'apply',
      op: op.name,
      args,
    };

    this.ws.send(JSON.stringify(serialize(message)));
  }

  close() {
    this.ws.close();
    this.state.isConnected = false;
    this.state.data = null;
    this.state.token = null;
  }
}

export class OfflineDriver implements Driver {
  state: State;

  constructor() {
    this.state = reactive({
      data: {
        name: 'Offline group',
        nextId: 1,
        people: [],
        transactions: [],
      },
      token: 'offline',
      isConnected: true,
      isConnecting: false,
      isPendingSync: false,
    })
  }

  apply<A extends unknown[]>(op: Operation<A>, ...args: A): void {
    op.impl(this.state.data!, ...args);
  }

  close(): void { }
}
