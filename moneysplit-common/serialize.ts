import { assert, map } from './util';

const META_KEY = '_mfro';

export type Serializable =
  | any
  | Date
  | string
  | number
  | bigint
  | boolean
  | null
  | Serializable[]

export function serialize(t: Serializable): unknown {
  return serialize(t);

  function serialize(t: Serializable): unknown {
    switch (typeof t) {
      case 'function':
      case 'symbol':
      case 'undefined':
        debugger;
        throw new Error('not supported');

      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
        return t;

      case 'object':
        if (t === null)
          return null;

        if (t.constructor === Object) {
          assert(!(META_KEY in t), 'invalid meta key')

          return map(t as any, (k, v) => serialize(v));
        } else if (Array.isArray(t)) {
          return t.map(serialize);
        }

        let label, value;
        if (t instanceof Date) {
          value = t.toISOString();
          label = 'Date';
        } else {
          assert(false, `unknown type: ${value}`);
        }

        return { [META_KEY]: label, value: value };
    }
  }
}

export function deserialize(t: unknown): Serializable {
  return deserialize(t);

  function deserialize(t: unknown): Serializable {
    switch (typeof t) {
      case 'function':
      case 'symbol':
      case 'undefined':
        debugger;
        throw new Error('not supported');

      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
        return t;

      case 'object':
        if (t === null)
          return null;

        if (Array.isArray(t)) {
          return t.map(deserialize);
        } else if (META_KEY in t) {
          assert(typeof t[META_KEY] === 'string' && 'value' in t, 'invalid object');
          const type = t[META_KEY];

          let value;
          if (type === 'Date') {
            assert(typeof t.value === 'string', 'invalid date');
            value = new Date(t.value);
          } else {
            assert(false, `unknown type: ${type}`);
          }

          return value;
        } else {
          return map(t as any, (k, v) => deserialize(v));
        }
    }
  }
}

export function clone<T extends Serializable>(t: T): T {
  return clone(t);

  function clone<T extends Serializable>(t: T): T {
    switch (typeof t) {
      case 'function':
      case 'symbol':
      case 'undefined':
        debugger;
        throw new Error('not supported');

      case 'bigint':
      case 'boolean':
      case 'number':
      case 'string':
        return t;

      case 'object':
        if (t === null)
          return t;

        let value;
        if (t.constructor === Object) {
          value = map(t as any, (k, v) => clone(v));
        } else if (Array.isArray(t)) {
          value = t.map(clone);
        } else if (t instanceof Date) {
          value = t;
        }

        return value;
    }
  }
}
