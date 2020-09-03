import { EventEmitter } from 'events';
import { castArray } from './castArray';

type WrappedValue<T> = {
  v: T;
  t: number;
};

type ValueSetItem<Key, Value> = {
  ttl: number;
  val: Value;
  key: Key;
};

interface Options {
  /**
   * If enabled, all values will be stringified during the set operation
   *
   * @type {boolean}
   * @memberof Options
   */
  forceString?: boolean;

  objectValueSize?: number;
  promiseValueSize?: number;
  arrayValueSize?: number;

  /**
   * standard time to live in seconds. 0 = infinity
   *
   * @type {number}
   * @memberof Options
   */
  stdTTL?: number;

  /**
   * time in seconds to check all data and delete expired keys
   *
   * @type {number}
   * @memberof Options
   */
  checkperiod?: number;

  /**
   * en/disable cloning of variables.
   * disabling this is strongly encouraged when aiming for performance!
   *
   * If `true`: set operations store a clone of the value and get operations will create a fresh clone of the cached value
   * If `false` you'll just store a reference to your value
   *
   * @type {boolean}
   * @memberof Options
   */
  useClones?: boolean;

  errorOnMissing?: boolean;
  deleteOnExpire?: boolean;

  /**
   * enable legacy callbacks.
   * legacy callback support will drop in v6.x!
   *
   * @type {boolean}
   * @memberof Options
   */
  enableLegacyCallbacks?: boolean;

  /**
   * max amount of keys that are being stored.
   * set operations will throw an error when the cache is full
   *
   * @type {number}
   * @memberof Options
   */
  maxKeys?: number;
}

const wrap = <T>(
  value: T,
  ttl: number,
  options: Pick<Options, 'stdTTL'> = {}
): WrappedValue<T> => {
  const now = Date.now();
  const ttlMulti = 1000;
  let liveTime = 0;

  if (ttl === 0) {
    liveTime = 0;
  } else if (ttl) {
    liveTime = now + ttl * ttlMulti;
  } else {
    const { stdTTL } = options;
    if (stdTTL === 0) {
      liveTime = stdTTL;
    } else {
      liveTime = now + stdTTL * ttlMulti;
    }
  }

  return {
    t: liveTime,
    v: value,
  };
};
const unwrap = <T>(value: WrappedValue<T>) => value.v;

/**
 * A copy of node_cache but without stats and allowing for different keys
 *
 * @export
 * @class Cache
 * @extends {EventEmitter}
 * @template Value
 * @template Key
 */
export class Cache<Value = any, Key = any> extends EventEmitter {
  #data: Map<Key, WrappedValue<Value>>;
  options: Options;
  checkTimeout: NodeJS.Timeout;

  constructor(options: Options) {
    super();
    this.options = options;
    this.#data = new Map();

    this._checkData();
  }

  /**
   * get a cached key and change the stats
   *
   * @param key cache key
   * @returns The value stored in the key
   */
  get<T extends Value = Value>(key: Key): T | undefined {
    const data = this.#data.get(key);
    if (this.#data.has(key) && this._check(key, data)) {
      return unwrap(data) as T;
    }
    return void 0;
  }

  /**
   * get multiple cached keys at once and change the stats
   *
   * @param keys an array of keys
   * @returns an object containing the values stored in the matching keys
   */
  mget<T extends Value = Value>(keys: Key[]): Map<Key, T> {
    const output: Map<Key, T> = new Map();

    for (const key of keys) {
      const data = this.#data.get(key);

      if (this.#data.has(key) && this._check(key, data)) {
        output.set(key, unwrap(data) as T);
      }
    }

    return output;
  }

  /**
   * set a cached key and change the stats
   *
   * @param key cache key
   * @param value A element to cache. If the option `option.forceString` is `true` the module trys to translate
   * it to a serialized JSON
   * @param ttl The time to live in seconds.
   */
  set<T extends Value = Value>(key: Key, value: T, ttl?: number): boolean {
    const usedTtl = ttl ?? this.options.stdTTL;

    this.#data.set(key, wrap(value, usedTtl, this.options));

    this.emit('set', key, value);

    return true;
  }

  /**
   * set multiple cached keys at once and change the stats
   *
   * @param keyValueSet an array of object which includes key,value and ttl
   */
  mset<T extends Value = Value>(
    keyValueSet: ValueSetItem<Key, Value>[]
  ): boolean {
    const len = keyValueSet.length;
    for (let i = 0; i < len; i++) {
      const { key, val, ttl } = keyValueSet[i];
      this.set(key, val, ttl);
    }
    return true;
  }

  /**
   * remove keys
   * @param keys cache key to delete or a array of cache keys
   * @param cb Callback function
   * @returns Number of deleted keys
   */
  del(keys: Key | Key[]): number {
    let deleted = 0;
    const keyArr = castArray(keys);
    const data = this.#data;

    for (const key of keyArr) {
      if (this.#data.has(key)) {
        const oldVal = data.get(key);
        data.delete(key);
        deleted++;
        this.emit('delete', key, oldVal);
      }
    }

    return deleted;
  }

  /**
   * get a cached key and remove it from the cache.
   * Equivalent to calling `get(key)` + `del(key)`.
   * Useful for implementing `single use` mechanism such as OTP, where once a value is read it will become obsolete.
   *
   * @param key cache key
   * @returns The value stored in the key
   */
  take<T extends Value = Value>(key: Key): T | undefined {
    const output = this.get(key);

    if (this.#data.has(key)) {
      this.del(key);
    }

    return output as T;
  }

  /**
   * reset or redefine the ttl of a key. If `ttl` is not passed or set to 0 it's similar to `.del()`
   */
  ttl(key: Key, ttl: number = this.options.stdTTL): boolean {
    if (!key) {
      return false;
    }

    const value = this.#data.get(key);
    if (this.#data.has(key) && this._check(key, value)) {
      if (ttl >= 0) {
        this.#data.set(key, wrap(value.v, ttl, this.options));
      } else {
        this.del(key);
      }
      return true;
    } else {
      return false;
    }
  }

  getTtl(key: Key): number | undefined {
    if (!key) {
      return void 0;
    }

    const value = this.#data.get(key);
    if (this.#data.has(key) && this._check(key, value)) {
      return value.t;
    } else {
      return void 0;
    }
  }

  /**
   * list all keys within this cache
   * @returns An array of all keys
   */
  keys(): IterableIterator<Key> {
    return this.#data.keys();
  }

  /**
   * get the stats
   *
   * @returns Stats data
   */
  // getStats(): Stats {

  // }

  /**
   * Check if a key is cached
   * @param key cache key to check
   * @returns Boolean indicating if the key is cached or not
   */
  has(key: Key): boolean {
    return this.has(key) && this._check(key, this.#data.get(key));
  }

  /**
   * flush the whole data and reset the stats
   */
  flushAll(_startPeriod = true): void {
    this.#data.clear();
    this._killCheckPeriod();
    this._checkData(_startPeriod);
    this.emit('flush');
  }

  /**
   * This will clear the interval timeout which is set on checkperiod option.
   */
  close(): void {
    this._killCheckPeriod();
  }

  /**
   * flush the stats and reset all counters to 0
   */
  flushStats(): void {}

  _check(key: Key, data) {
    let ret = true;
    if (data.t !== 0 && data.t < Date.now()) {
      if (this.options.deleteOnExpire) {
        ret = false;
        this.del(key);
      }
      this.emit('expired', key, unwrap(data));
    }
    return ret;
  }

  _killCheckPeriod() {
    if (this.checkTimeout != null) {
      const checkTimeout = this.checkTimeout;
      this.checkTimeout = null;
      return clearTimeout(checkTimeout);
    }
  }

  _checkData(startPeriod: boolean = false): void {
    const ref = this.#data;

    for (const [key, value] of ref) {
      this._check(key, value);
    }

    if (startPeriod && this.options.checkperiod > 0) {
      this.checkTimeout = setTimeout(
        this._checkData,
        this.options.checkperiod * 1000,
        startPeriod
      );
      if (this.checkTimeout != null && this.checkTimeout.unref != null) {
        this.checkTimeout.unref();
      }
    }
  }
}
