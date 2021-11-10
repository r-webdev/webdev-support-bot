export function unary<T, U>(fn: (firstArg: T, ...restArgs: never[]) => U) {
  return (arg: T): U => fn(arg);
}
