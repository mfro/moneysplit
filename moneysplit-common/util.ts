export function assert(value: boolean, message: string): asserts value {
  if (!value) throw new Error(message);
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function map<T extends {}, V extends { [K in keyof T]: any }>(o: T, fn: <K extends keyof T>(k: keyof T, v: T[K]) => V[K]) {
  const result = {} as any;
  for (const key in o) {
    result[key] = fn(key, o[key]);
  }
  return result;
}

export function zip<A, B>(a: A[], b: B[]) {
  assert(a.length == b.length, 'invalid zip');

  return a.map((v, i) => [v, b[i]!] as const);
}

export function dateEquals(a: Date, b: Date) {
  return a.getFullYear() == b.getFullYear()
    && a.getMonth() == b.getMonth()
    && a.getDate() == b.getDate()
}
