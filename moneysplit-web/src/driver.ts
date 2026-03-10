import { reactive, watchEffect } from 'vue';
import { assert, delay, deserialize, serialize, type Group, type Message, type Operation } from '../../moneysplit-common';
import { putKnownGroup } from './localStorage';

export interface State {
  isConnecting: boolean;
  isConnected: boolean;

  token: string | null
  data: Group | null;
}

export interface Driver {
  readonly state: State;

  apply<A extends unknown[]>(op: Operation<A>, ...args: A): void;
  close(): void;
}

export class WebSocketDriver implements Driver {
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

        message.op.impl(state.data, ...message.args);
      }
    });
  }

  static connect(path: string) {
    const url = new URL(path, 'wss://api.mfro.me/moneysplit/');

    const ws = new WebSocket(url);

    const state: State = reactive({
      isConnecting: true,
      isConnected: false,

      token: null,
      data: null,
    });

    return new WebSocketDriver(state, ws);
  }

  apply<A extends unknown[]>(op: Operation<A>, ...args: A) {
    const message: Message = {
      type: 'apply',
      op: op as Operation,
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
    })
  }

  apply<A extends unknown[]>(op: Operation<A>, ...args: A): void {
    op.impl(this.state.data!, ...args);
  }

  close(): void {
  }
}
