type PipeFunctions<Input, Output> = [
  (input: Input) => unknown,
  ...Function[],
  (input: unknown) => Output
];

export function pipe<Input, Output>(
  fns: PipeFunctions<Input, Output>
): (input: Input) => Output {
  return (item: Input) => fns.reduce((input, fn) => fn(input), item) as Output;
}
