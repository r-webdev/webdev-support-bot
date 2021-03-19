import { filter } from 'domyno';

export function intersection(a: Iterable<unknown>, b: Iterable<unknown>) {
  const bSet = b instanceof Set ? b : new Set(b);
  return new Set(filter(x => bSet.has(x))(a));
}

export function union(a: Iterable<unknown>, b: Iterable<unknown>) {
  return new Set([...a, ...b]);
}

export function difference(a: Iterable<unknown>, b: Iterable<unknown>) {
  const bSet = b instanceof Set ? b : new Set(b);
  return new Set(filter(x => !bSet.has(x))(a));
}
