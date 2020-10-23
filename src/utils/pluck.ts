export function* pluckʹ<T extends Record<K, V>, V, K extends keyof any>(
  iter: Iterable<T>,
  str: K
): Iterable<V> {
  for (const item of iter) {
    yield item[str];
  }
}

export function pluck<K extends keyof any>(key: K) {
  return <V, T extends Record<K, V> = Record<K, V>>(
    iter: Iterable<T>
  ): Iterable<V> => pluckʹ(iter, key);
}
