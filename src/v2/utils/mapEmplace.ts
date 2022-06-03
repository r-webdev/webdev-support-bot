
/**
 * Emplaces or upserts into a map. Upserting inserts a value if a key doesn't exist or updates it if it does. The interface
 * matches the Stage 2 Map#emplace method https://github.com/tc39/proposal-upsert
 * @template Key Map key type
 * @template Value Map value type
 * @param map Map to operate on
 * @param key key to operate on
 * @param options object containing an update and/or an insert function used to act upon they key and value depending on if the key exists or not (respectively)
 */
 export function emplaceMap<Key, Value>(
  map: Map<Key, Value>,
  key: Key,
  {
    update,
    insert,
  }: {
    update?: (existing: Value, key: Key, map: Map<Key, Value>) => Value;
    insert?: (key: Key, map: Map<Key, Value>) => Value;
  }
): Value {
  if (!(update || insert)) {
    throw new Error('You must provide at least an update or insert function');
  }
  const existing = map.has(key);
  if (existing && update) {
    // We **know** that key exists in the map TS is just dumb
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const old = map.get(key)!;
    map.set(key, update(old, key, map));
  }
  if (!existing && insert) {
    map.set(key, insert(key, map));
  }

  return map.get(key) ;
}
