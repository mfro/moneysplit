import { customRef, reactive, toRaw } from 'vue';
import { assert, deserialize, serialize } from '../../moneysplit-common';

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

export interface KnownGroup {
  name: string;
  token: string;
  hidden?: boolean;
}

const KNOWN_GROUPS_KEY = localStorageRef<KnownGroup[]>('mfro:moneysplit:knownGroups');
export const knownGroups: KnownGroup[] = reactive(KNOWN_GROUPS_KEY.value ?? []);

function saveKnownGroups() {
  KNOWN_GROUPS_KEY.value = toRaw(knownGroups);
}

export function putKnownGroup(token: string, name: string) {
  let group = knownGroups.find(g => g.token == token);
  if (group) {
    group.name = name;
  } else {
    knownGroups.push({ token, name })
  }

  saveKnownGroups();
}

export function toggleKnownGroup(group: KnownGroup) {
  group.hidden = !group.hidden
  saveKnownGroups();
}

export function removeKnownGroup(group: KnownGroup) {
  const index = knownGroups.indexOf(group);
  assert(index != -1, 'invalid removeKnownGroup');

  knownGroups.splice(index, 1);
  saveKnownGroups();
}

export const localUserName = localStorageRef<'string'>('mfro:user-name', true);
