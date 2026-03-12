import { assert, BiMap, map } from './util';

const META_KEY = '_mfro';
const CONSTANT_ID = -2;

export type Serializable =
  | any
  | Date
  | string
  | number
  | bigint
  | boolean
  | null
  | Serializable[]

const types = new BiMap<string, Function>();
const constants = new BiMap<number, Serializable>();

registerType(Object);
registerType(Array);
registerType(Date);

export function addConstant(value: Serializable) {
  constants.set(constants.size, value);
}

function getTypeById(typeId: string) {
  const type = types.getForward(typeId);
  assert(!!type, `unknown type: ${typeId}`);

  return type;
}

function getTypeIdByValue(value: any) {
  const typeId = types.getBackward(value.constructor);
  assert(!!typeId, `unknown type: ${value.constructor.name}`);

  return typeId;
}

function registerType(t: Function, typeId = t.name) {
  assert(!types.getForward(typeId), `duplicate type: ${typeId}`);
  types.set(typeId, t);
}

export function register<T extends {}>(typeId: string) {
  return <C extends new (...args: any[]) => T>(t: C) => {
    registerType(t, typeId);
    return t;
  };
}

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
        if (t == null)
          return null;

        if (constants.hasBackward(t)) {
          if (!constants.hasForward(constants.getBackward(t)!))
            debugger;
          return { [META_KEY]: CONSTANT_ID, value: constants.getBackward(t) };
        } else if (t.constructor == Object) {
          assert(!(META_KEY in t), 'invalid meta key')

          return map(t as any, (k, v) => serialize(v));
        } else if (Array.isArray(t)) {
          return t.map(serialize);
        }

        const label = getTypeIdByValue(t);

        let value;
        if (t instanceof Date) {
          value = t.toISOString();
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
        if (t == null)
          return null;

        if (Array.isArray(t)) {
          // TODO remove backwards compatibility
          if (t.length == 2 && t[0] == CONSTANT_ID && typeof t[1] == 'number' && constants.hasForward(t[1])) {
            return constants.getForward(t[1]);
          } else if (t.length == 2 && types.hasForward(t[0])) {
            const type = getTypeById(t[0]);
            let value;

            if (type == Object) {
              value = map(t[1], (k, v) => deserialize(v));
            } else if (type == Array) {
              value = (t[1] as Array<any>).map(deserialize);
            } else if (type == Date) {
              value = new Date(t[1]);
            }

            return value;
          }

          return t.map(deserialize);
        } else if (META_KEY in t) {
          if (t[META_KEY] == CONSTANT_ID) {
            assert('value' in t && typeof t.value == 'number' && constants.hasForward(t.value), 'invalid constant');
            return constants.getForward(t.value);
          } else {
            assert(typeof t[META_KEY] == 'string' && 'value' in t, 'invalid object');
            const type = getTypeById(t[META_KEY])

            let value;
            if (type == Date) {
              assert(typeof t.value == 'string', 'invalid date');
              value = new Date(t.value);
            } else {
              assert(false, `unknown type: ${type}`);
            }

            return value;
          }
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
        if (t == null)
          return t;

        if (constants.hasBackward(t)) {
          return t;
        }

        let value;
        if (t.constructor == Object) {
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
