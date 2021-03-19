/**
 * If item is an array return it else wrap it in an array
 *
 * WIIIILLSOOOOON
 * @param item
 */
export function castArray<T>(item: T | T[]): T[] {
  return Array.isArray(item) ? item : [item];
}
