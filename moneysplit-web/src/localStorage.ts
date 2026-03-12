import { customRef, reactive, toRaw, watch, watchEffect } from 'vue';
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

function persist<T extends object>(key: string, initializer: () => T) {
  let raw: T;
  try {
    if (key in localStorage) {
      raw = deserialize(JSON.parse(window.localStorage.getItem(key)!));
    } else {
      raw = initializer();
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

export const localUserName = localStorageRef<'string'>('mfro:user-name', true);

export const knownGroups = persist<KnownGroup[]>(
  'mfro:moneysplit:knownGroups',
  () => [],
);

export function putKnownGroup(token: string, name: string) {
  let group = knownGroups.find(g => g.token == token);
  if (group) {
    group.name = name;
  } else {
    knownGroups.push({ token, name })
  }
}
// const KNOWN_GROUPS = localStorageRef<KnownGroup[]>('mfro:moneysplit:knownGroups', true);
// export const knownGroups: KnownGroup[] = reactive(KNOWN_GROUPS.value ?? []);

// function saveKnownGroups() {
//   KNOWN_GROUPS.value = toRaw(knownGroups);
// }

// export function putKnownGroup(token: string, name: string) {
//   let group = knownGroups.find(g => g.token == token);
//   if (group) {
//     group.name = name;
//   } else {
//     knownGroups.push({ token, name })
//   }

//   saveKnownGroups();
// }

// export function toggleKnownGroup(group: KnownGroup) {
//   group.hidden = !group.hidden
//   saveKnownGroups();
// }

// export function removeKnownGroup(group: KnownGroup) {
//   const index = knownGroups.indexOf(group);
//   assert(index != -1, 'invalid removeKnownGroup');

//   knownGroups.splice(index, 1);
//   saveKnownGroups();
// }
