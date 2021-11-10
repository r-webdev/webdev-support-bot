export function* flatten<T>(iter: Iterable<Iterable<T>>) {
  for (const item of iter) {
    yield* item;
  }
}
