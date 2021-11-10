export function some<T>(
  predicate: (item: T, index: number, iter: Iterable<T>) => any
) {
  return function (iter: Iterable<T>) {
    let i = 0;
    for (const item of iter) {
      if (predicate(item, i++, iter)) return true;
    }
    return false;
  };
}
