export function unary<T, U>(fn: (firstArg: T, ...restArgs: any[]) => U) {
  return (arg: T) => fn(arg);
}
