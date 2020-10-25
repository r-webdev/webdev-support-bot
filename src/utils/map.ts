/**
 * same as Array#map but works on all iterables, returns an iterable
 *
 * @export
 * @template T input iterable
 * @template U output iterable
 * @param {(item: T, index: number, iter: Iterable<T>) => U} fn
 * @param {Iterable<T>} iter
 */
export function* mapʹ<T, U>(
  fn: (item: T, index: number, iter: Iterable<T>) => U,
  iter: Iterable<T>
) {
  let i = 0;
  for (const item of iter) {
    yield fn(item, i++, iter);
  }
}

export function map<T, U>(
  fn: (item: T, index: number, iter: Iterable<T>) => U
) {
  return (iter: Iterable<T>) => mapʹ(fn, iter);
}
