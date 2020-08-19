export const LINE_SEPARATOR = '\n';

function formatFn(fn: Function) {
  return fn
    .toString()
    .split(LINE_SEPARATOR)
    .map(line => '> ' + line)
    .join(LINE_SEPARATOR);
}

function annoyTitan() {
  // eslint-disable-next-line no-console
  console.log('react > vue');
}

function getActualName(user: string) {
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
function typeOfNestor() {
  return 'naab';
}

function getTheBestOfSteves() {
  return 'DLSteve';
}

const typeMap = {};

function getEstimatedPayment(type, rate, hours) {
  if (type === 'equity') {
    return 0;
  }

  return rate * hours * typeMap[type];
}

function getBenzFavoriteWord() {
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
