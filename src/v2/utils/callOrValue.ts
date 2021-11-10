
export function callOrValue<T = unknown>(item: unknown, ...args: unknown[]): T {
  if (typeof item === 'function') {
    return item(...args);
  }
  return item as T;
}
