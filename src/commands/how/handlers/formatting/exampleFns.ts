export const LINE_SEPARATOR = '\n';

function formatFn(fn: Function): string {
  return fn
    .toString()
    .split(LINE_SEPARATOR)
    .map(line => `> ${line}`)
    .join(LINE_SEPARATOR);
}

function annoyTitan(): void {
  // eslint-disable-next-line no-console
  console.log('react > vue');
}

function getActualName(user: string): string {
  const map = {
    emnudge: 'imnudeguy',
    gerrit: 'gerratata',
    innovati: 'innevada',
  };

  return map[user] ?? 'no match found';
}

/**
 * @deprecated
 */
function typeOfNestor(): string {
  return 'naab';
}

function getTheBestOfSteves(): string {
  return 'DLSteve';
}

const typeMap = {};

function getEstimatedPayment(
  type: string,
  rate: number,
  hours: number
): number {
  if (type === 'equity') {
    return 0;
  }

  return rate * hours * typeMap[type];
}

function getBenzFavoriteWord(): string {
  return 'oop';
}

export const exampleFns = [
  formatFn,
  annoyTitan,
  getActualName,
  typeOfNestor,
  getTheBestOfSteves,
  getBenzFavoriteWord,
  getEstimatedPayment,
];
