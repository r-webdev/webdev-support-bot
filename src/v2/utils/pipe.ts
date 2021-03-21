export function pipe<Input = unknown, Output = unknown>(
  fns: Function[]
): (input: Input) => Output {
  return (item: Input) => fns.reduce((input, fn) => fn(input), item) as Output;
}
