type ObjectKeyType = string | number | symbol;

export function search(fn: (path: ObjectKeyType[], value: any) => any) {
  function* _recursiveSearch(
    value: any,
    path: ObjectKeyType[] = [],
    seen: Set<any>,
    skipOnMatch: boolean
  ) {
    if (fn(path, value)) {
      yield [path, value];
    }

    if (value == null || typeof value !== 'object') {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      const len = value.length;
      for (let i = 0; i < len; i++) {
        const item = value[i];
        if (seen.has(item)) continue;
        yield* _recursiveSearch(item, path.concat(i), seen, skipOnMatch);
      }
      return;
    }

    for (const [key, val] of Object.entries(value)) {
      if (seen.has(val)) continue;
      yield* _recursiveSearch(val, path.concat(key), seen, skipOnMatch);
    }
  }
  return function* (obj: any, skipOnMatch = false) {
    const seen = new Set();
    yield* _recursiveSearch(obj, [], seen, skipOnMatch);
  };
}
