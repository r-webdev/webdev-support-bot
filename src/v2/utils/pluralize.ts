import { callOrValue } from './callOrValue.js';

type PluralizeFunction = {
  (
    strs: TemplateStringsArray,
    ...exprs: (((n: number) => string) | string | { toString(): string })[]
  ): (n: number) => string;
  s: (n: number) => string;
  mapper: typeof mapper;
  n: <T>(x: T) => T;
};

const listFormatter = new Intl.ListFormat();

const pluralize = ((
  strs: TemplateStringsArray,
  ...exprs: (((n: number) => string) | string | { toString(): string })[]
) => {
  return (n: number) =>
    strs.reduce((acc, item, i) => {
      const exp = exprs[i - 1];
      if (Array.isArray(exp)) {
        return acc + listFormatter.format(exp) + item;
      }
      return `${acc}${callOrValue<string>(exp, n)}${item}`;
    });
}) as PluralizeFunction;

pluralize.s = mapper({ 1: '' }, 's');
pluralize.mapper = mapper;
pluralize.n = x => x;

export { pluralize, pluralize as _, mapper };

function mapper(
  map: Record<number, string>,
  defaultStr: string
): (n: number) => string {
  return (n: number) => map[n] ?? defaultStr;
}
