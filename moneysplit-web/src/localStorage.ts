import { customRef, reactive, toRaw, watch } from 'vue';
import { deserialize, serialize, type Group } from '../../moneysplit-common';

export const localStorage = {
  get(name: string, rawString = false) {
    try {
      const raw = window.localStorage.getItem(name);
      return rawString
        ? raw
        : deserialize(JSON.parse(raw!));
    } catch (e) {
      return undefined;
    }
  },

  set(name: string, value: any, rawString = false) {
    window.localStorage.setItem(name, rawString ? value : JSON.stringify(serialize(value)));
  },
};

export function localStorageRef<T = unknown>(name: string, rawString = false) {
  let value = localStorage.get(name, rawString);

  return customRef<T | null>((track, trigger) => ({
    get() {
      track();
      return value;
    },

    set(v) {
      value = v;
      localStorage.set(name, v, rawString)
      trigger();
    },
  }));
}

function persist<T extends object>(key: string, initializer: () => T) {
  let raw: T;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) {
      raw = initializer();
    } else {
      raw = deserialize(JSON.parse(stored));
    }
  } catch {
    raw = initializer();
  }

  const value = reactive(raw);

  watch(value, () => {
    window.localStorage.setItem(key, JSON.stringify(serialize(toRaw(value))));
  });

  return value;
}

export const localUserName = localStorageRef<string>('mfro:user-name', true);

export interface AppState {
  newGroups: OfflineGroup[];
  knownGroups: { [token: string]: OfflineGroup }
}

export interface OfflineGroup {
  hidden: boolean,
  group: Group,
  queue: OfflineApply[],
}

export interface OfflineApply {
  op: string,
  args: unknown[],
}

export const appState = persist<AppState>(
  'mfro:moneysplit:state',
  () => ({
    newGroups: [],
    knownGroups: {},
  }),
);
