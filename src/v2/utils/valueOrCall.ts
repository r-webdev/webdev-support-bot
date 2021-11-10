export function valueOrCall<T>(valueOrFn: T | (() => T)): T {
  return valueOrFn instanceof Function ? valueOrFn() : valueOrFn;
}

export type ValueOrNullary<T> = T | (() => T);
