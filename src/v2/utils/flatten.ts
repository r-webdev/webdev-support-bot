export function* flatten<T>(iter: Iterable<Iterable<T>>): IterableIterator<T> {
  for (const item of iter) {
    yield* item;
  }
}
