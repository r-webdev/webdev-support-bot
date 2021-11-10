export function chunkUntil<T>(
  fn: (currentChunk: T[], next: T, index: number) => boolean
) {
  return function* (iter: Iterable<T>): Iterable<T[]> {
    let current = [];
    let index = 0;
    for (const item of iter) {
      if (fn(current, item, index++)) {
        yield current;
        current = [item];
      } else {
        current.push(item);
      }
    }

    if (current.length > 0) {
      yield current;
    }
  };
}
