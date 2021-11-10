export const capitalize = (str: string): string =>
  str
    .split(' ')
    .map(s => `${s[0].toUpperCase()}${s.slice(1).toLowerCase()}`)
    .join(' ');
