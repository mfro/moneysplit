import { reactive } from 'vue';
import { assert, clone, CLOSE_REASON_GROUP_NOT_FOUND, deserialize, newGroup, operations, serialize, VERSION, type Group, type Message, type Operation } from 'moneysplit-common';
import { type OfflineApply, type OfflineGroup, appState } from './localStorage';

export interface State {
  token: string | null;
  group: Group | null;

  isConnecting: boolean;
  isConnected: boolean;
  isPendingSync: boolean;

  close_reason: string | null;
}

export interface Driver {
  readonly state: State;

  startConnection(): void;

  apply<A extends unknown[]>(op: Operation<A>, ...args: A): void;
  close(): void;
}

export interface Connection {
  socket: WebSocket;
  rollbackQueue: Group[];
}

export class WebSocketDriver implements Driver {
  readonly state: State;
  private offline: OfflineGroup | null;
  private connection: Connection | null = null;

  private cleanup: (() => void)[] = [];

  private constructor(offline: OfflineGroup | null, token: string | null) {
    this.offline = offline;

    this.state = reactive({
      token: token,
      group: offline?.group ?? null,

      isConnected: false,
      isConnecting: false,
      isPendingSync: false,

      close_reason: null,
    });

    const onOnline = () => {
      if (!this.connection) this.startConnection();
    };

    window.addEventListener('online', onOnline);
    this.cleanup.push(() => window.removeEventListener('online', onOnline));
  }

  startConnection() {
    if (this.connection) return;

    const base = localStorage.getItem('mfro:moneysplit:server') ?? 'wss://api.mfro.me/moneysplit/';
    const url = new URL(`connect`, base);

    url.searchParams.set('version', VERSION.toString());

    if (this.state.token) {
      url.searchParams.set('token', this.state.token);
    }

    const socket = new WebSocket(url);
    const rollbackQueue: Group[] = [];

    socket.addEventListener('error', async (e) => {
      console.error(e);
    });

    socket.addEventListener('open', (e) => {
      console.log('socket opened', e);
    });

    socket.addEventListener('close', (e) => {
      console.log('socket closed', e);

      this.connection = null;

      this.state.isConnecting = false;
      this.state.isConnected = false;
      this.state.isPendingSync = false;

      if (e.reason === CLOSE_REASON_GROUP_NOT_FOUND) {
        this.state.close_reason = e.reason;
      }
    });

    socket.addEventListener('message', (e) => {
      const message = deserialize(JSON.parse(e.data)) as Message;

      if (message.type === 'init') {

        this.state.isConnecting = false;
        this.state.isConnected = true;

        this.state.token = message.token;
        this.state.group = message.group;

        if (this.offline) {
          const redrive = this.offline.queue.slice();
          this.offline.group = message.group;
          this.offline.queue = [];

          const index = appState.newGroups.indexOf(this.offline);
          if (index !== -1) appState.newGroups.splice(index, 1);

          appState.knownGroups[this.state.token] = this.offline;

          for (const apply of redrive) {
            const op = operations.get(apply.op);
            assert(!!op, 'unknown operation');

            this.apply(op, ...apply.args);
          }
        } else {
          appState.knownGroups[this.state.token] = this.offline = {
            hidden: false,
            group: this.state.group,
            queue: [],
          };
        }

      } else if (message.type === 'apply') {

        const op = operations.get(message.op);
        assert(!!op, 'unknown operation');
        assert(!!this.offline, 'invalid apply');
        assert(!!this.state.group, 'invalid apply');

        const nextPending = this.offline.queue.shift();
        const nextRollback = rollbackQueue.shift();
        if (nextPending && nextRollback) {
          if (!isExpected(nextPending, message.op, message.args)) {
            console.error(`desync detected! rolling back changes: ${rollbackQueue.length + 1}`);

            this.state.group = nextRollback;
            this.offline.group = nextRollback;
            this.offline.queue = [];

            op.impl(this.state.group, ...message.args);
          }
        } else {
          op.impl(this.state.group, ...message.args);
        }

        this.state.isPendingSync = rollbackQueue.length > 0;

      }
    });

    this.connection = {
      socket,
      rollbackQueue,
    };

    this.state.isConnected = false;
    this.state.isConnecting = true;
    this.state.isPendingSync = false;

    this.state.close_reason = null;
  }

  apply<A extends unknown[]>(op: Operation<A>, ...args: A): void {
    assert(!!this.offline, 'invalid apply');
    assert(!!this.state.group, 'invalid apply');

    const beforeState = clone(this.state.group);

    op.impl(this.state.group, ...args);

    if (this.connection) {
      this.connection.rollbackQueue.push(beforeState);
      this.offline.queue.push({
        op: op.name,
        args,
      });

      const message: Message = {
        type: 'apply',
        op: op.name,
        args,
      };

      this.connection.socket.send(JSON.stringify(serialize(message)));

      this.state.isPendingSync = true;
    } else {
      assert(!!this.offline, 'how apply without state');

      this.offline.queue.push({
        op: op.name,
        args: args,
      });
    }
  }

  close(): void {
    this.connection?.socket.close();
    for (const fn of this.cleanup) fn();
  }

  static create() {
    const offline: OfflineGroup = {
      hidden: false,
      group: newGroup(),
      queue: [],
    };

    appState.newGroups.push(offline);

    const driver = new WebSocketDriver(offline, null);

    driver.startConnection();

    return driver;
  }

  static connectToken(token: string) {
    const offline = appState.knownGroups[token] ?? null;

    const driver = new WebSocketDriver(offline, token);

    driver.startConnection();

    return driver;
  }

  static openLocal(local: OfflineGroup) {
    const driver = new WebSocketDriver(local, null);

    driver.startConnection();

    return driver;
  }
}

function isExpected(entry: OfflineApply, op: string, args: unknown[]) {
  // TODO improve this implementation
  return op === entry.op
    && JSON.stringify(serialize(args)) === JSON.stringify(serialize(entry.args));
}
