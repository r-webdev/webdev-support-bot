export function some<T>(
  predicate: (item: T, index: number, iter: Iterable<T>) => unknown
) {
  return function (iter: Iterable<T>): boolean {
    let i = 0;
    for (const item of iter) {
      if (predicate(item, i++, iter)) {
        return true;
      }
    }
    return false;
  };
}
