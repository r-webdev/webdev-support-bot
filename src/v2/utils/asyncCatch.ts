export function asyncCatch<T extends readonly unknown[],K>(fn:(...args:T) => Promise<K> ): (...args:T) => Promise<K> {
  return async (...args: T): Promise<K> => {
    try {
      return await fn(...args)
    } catch(e) {
      console.error(e)
    }
  }
}
