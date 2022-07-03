export function* pluckʹ<T extends Record<K, V>, V, K extends PropertyKey>(
  iter: Iterable<T>,
  str: K
): Iterable<V> {
  for (const item of iter) {
    yield item[str];
  }
}

export function pluck<K extends PropertyKey>(key: K) {
  return <V, T extends Record<K, V> = Record<K, V>>(
    iter: Iterable<T>
  ): Iterable<V> => pluckʹ(iter, key);
}
