type Fn<A = unknown, B = unknown> = (input: A) => B;

export function pipe<A, B>(ab: Fn<A, B>): Fn<A, B>;
export function pipe<A, B, C>(ab: Fn<A, B>, bc: Fn<B, C>): Fn<A, C>;
export function pipe<A, B, C, D>(
  ab: Fn<A, B>,
  bc: Fn<B, C>,
  cd: Fn<C, D>
): Fn<A, D>;
export function pipe<A, B, C, D, E>(
  ab: Fn<A, B>,
  bc: Fn<B, C>,
  cd: Fn<C, D>,
  de: Fn<D, E>
): Fn<A, E>;
export function pipe<A, B, C, D, E, F>(
  ab: Fn<A, B>,
  bc: Fn<B, C>,
  cd: Fn<C, D>,
  de: Fn<D, E>,
  ef: Fn<E, F>
): Fn<A, F>;

export function pipe(...fns: Fn[]): Fn {
  return (input: unknown) => fns.reduce((acc, fn) => fn(acc), input);
}
