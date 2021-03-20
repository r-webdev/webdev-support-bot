export function pipe(fns: Function[]) {
  return (item: any) => fns.reduce((input, fn) => fn(input), item);
}
