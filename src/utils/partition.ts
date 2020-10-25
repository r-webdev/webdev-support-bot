export function partitionʹ<T, U>(
  predicate: (item: T, index: number, iter: Iterable<T>) => U,
  iter: Iterable<T>
) {
  const success = [];
  const failed = [];
  let i = 0;
  for (const item of iter) {
    const arr = predicate(item, i++, iter) ? success : failed;
    arr.push(item);
  }
  return [success, failed];
}

export function partition<T, U>(
  predicate: (item: T, index: number, iter: Iterable<T>) => U
) {
  return function (iter: Iterable<T>) {
    return partitionʹ(predicate, iter);
  };
}
