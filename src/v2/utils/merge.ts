export function* merge<T>(...iterables: Iterable<T>[]) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}
