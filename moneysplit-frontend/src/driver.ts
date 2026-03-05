import { reactive } from 'vue';
import { assert, deserialize, serialize, type Group, type Message, type Operation } from '../../moneysplit-common';

export interface State {
  isConnecting: boolean;
  isConnected: boolean;

  token: string | null
  data: Group | null;
}

export class Driver {
  constructor(
    readonly state: State,
    readonly ws: WebSocket,
  ) {
    ws.addEventListener('close', () => {
      location.reload();
    });

    ws.addEventListener('error', (e) => {
      console.error(e);
      location.reload();
    });

    ws.addEventListener('open', () => {
      state.isConnected = true;
      state.isConnecting = false;
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
    const url = new URL(path, 'ws://localhost:8080');

    const ws = new WebSocket(url);

    const state: State = reactive({
      isConnecting: true,
      isConnected: false,

      token: null,
      data: null,
    });

    return new Driver(state, ws);
  }

  apply<A extends unknown[]>(op: Operation<A>, ...args: A) {
    const message: Message = {
      type: 'apply',
      op: op as Operation,
      args,
    };

    this.ws.send(JSON.stringify(serialize(message)));
  }
}
