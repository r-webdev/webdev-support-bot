/**
 * same as Array#filter but works on all iterables, returns an iterable
 *
 * @export
 * @template T input iterable
 * @template U output iterable
 * @param {(item: T, index: number, iter: Iterable<T>) => any} fn
 * @param {Iterable<T>} iter
 */
export function* filterʹ<T>(
  fn: (item: T, index: number, iter: Iterable<T>) => unknown,
  iter: Iterable<T>
) {
  let i = 0;
  for (const item of iter) {
    if (fn(item, i++, iter)) yield item;
  }
}

export function filter<T>(
  fn: (item: T, index: number, iter: Iterable<T>) => unknown
) {
  return (iter: Iterable<T>) => filterʹ(fn, iter);
}
