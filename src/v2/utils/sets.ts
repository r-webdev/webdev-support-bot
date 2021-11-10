import { filter } from 'domyno';

export function intersection<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
  const bSet = b instanceof Set ? b : new Set(b);
  return new Set(filter<T>(x => bSet.has(x))(a));
}

export function union<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
  return new Set([...a, ...b]);
}

export function difference<T>(a: Iterable<T>, b: Iterable<T>): Set<T> {
  const bSet = b instanceof Set ? b : new Set(b);
  return new Set(filter<T>(x => !bSet.has(x))(a));
}
