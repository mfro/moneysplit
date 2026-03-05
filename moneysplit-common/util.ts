export function assert(value: boolean, message: string): asserts value {
  if (!value) throw new Error(message);
}

export function map<T extends {}, V extends { [K in keyof T]: any }>(o: T, fn: <K extends keyof T>(k: keyof T, v: T[K]) => V[K]) {
  const result = {} as any;
  for (const key in o) {
    result[key] = fn(key, o[key]);
  }
  return result;
}

export class BiMap<T1, T2> {
  readonly forward = new Map<T1, T2>();
  readonly backward = new Map<T2, T1>();

  get size() {
    return this.forward.size;
  }

  clear() {
    this.forward.clear();
    this.backward.clear();
  }

  set(a: T1, b: T2) {
    this.forward.set(a, b);
    this.backward.set(b, a);
  }

  hasForward(a: T1) {
    return this.forward.has(a);
  }

  hasBackward(a: T2) {
    return this.backward.has(a);
  }

  getForward(a: T1) {
    return this.forward.get(a);
  }

  getBackward(a: T2) {
    return this.backward.get(a);
  }
}
