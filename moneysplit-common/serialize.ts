import { assert, BiMap, map } from './util';

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
  const seen = new Map<any, number>();
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

        if (seen.has(t)) {
          return [-1, seen.get(t)];
        } else if (constants.hasBackward(t)) {
          if (!constants.hasForward(constants.getBackward(t)!))
            debugger;
          return [-2, constants.getBackward(t)];
        }

        const label = getTypeIdByValue(t);

        let value;
        if (t.constructor == Object) {
          value = map(t as any, (k, v) => serialize(v));
        } else if (Array.isArray(t)) {
          value = t.map(serialize);
        } else if (t instanceof Date) {
          value = t.toISOString();
        }

        seen.set(t, seen.size);
        return [label, value];
    }
  }
}

export function deserialize(t: unknown): Serializable {
  const objects: any[] = [];
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

        assert(Array.isArray(t) && t.length == 2, 'unknown value');
        if (t[0] == -1) {
          assert(t[1] < objects.length, 'invalid reference');
          return objects[t[1]]!;
        } else if (t[0] == -2) {
          assert(constants.hasForward(t[1]), 'invalid constant');
          return constants.getForward(t[1]);
        }

        const type = getTypeById(t[0]);
        let value;

        if (type == Object) {
          value = map(t[1], (k, v) => deserialize(v));
        } else if (type == Array) {
          value = (t[1] as Array<any>).map(deserialize);
        } else if (type == Date) {
          value = new Date(t[1]);
        }

        objects.push(value);
        return value;
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
