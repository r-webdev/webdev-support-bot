import { map } from '../../utils/map.js';
import { merge } from '../../utils/merge.js';
import { partition } from '../../utils/partition.js';
import nothanks from './nothanks.js';
import nothankyou from './nothankyou.js';
import thanks from './thanks.js';
import thankyou from './thankyou.js';

type ThankDef = typeof thanks[number];

const wordBoundaryBefore = String.raw`(?<=^|$|\P{L})`;
const wordBoundaryAfter = String.raw`(?=^|$|\P{L})`;

const wordBoundarableRegex =
  /\p{Changes_When_Uppercased}|\p{Changes_When_Lowercased}/u;
const nonNegativableEnglish = ['cheers'];
const english = [
  'ty',
  'tyvm',
  'thanks',
  'thx',
  'tnx',
  'thank',
  'thnaks',
  'thankyou',
  'thanku',
  'thnkyou',
  'tysm',
  'thanx',
  'thnx',
];
const negativeEnglish = [
  ...english.flatMap(word => [
    `n ${word}`,
    `n${word}`,
    `no${word}`,
    `no ${word}`,
  ]),
  'no need to thank',
  'thanks,? but no thanks',
  'thanks for nothing',
];

const partitionWrap = partition(
  (str: string) => !!wordBoundarableRegex.test(str)
);

const mapTextFromDefs = map((def: ThankDef) =>
  removeDiacritics(def.text.toLocaleLowerCase(def.symbol))
);

const removeDiacritics = (str: string) =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const [thanksWrappable, thanksUnwrappable] = partitionWrap(
  new Set(merge(mapTextFromDefs(thanks), mapTextFromDefs(thankyou)))
);

const [noThanksWrappable, noThanksUnwrappable] = partitionWrap(
  new Set(merge(mapTextFromDefs(nothanks), mapTextFromDefs(nothankyou)))
);

const wrapThanksSet = new Set([
  ...english,
  ...nonNegativableEnglish,
  ...thanksWrappable,
]);
const wrapNoThanksSet = new Set([...negativeEnglish, ...noThanksWrappable]);

const or = <T>(iter: Iterable<T>) => `(?:${[...iter].join('|')})`;

const thanksRegex = new RegExp(
  String.raw`(?<!\/)((?:${wordBoundaryBefore}${or(
    wrapThanksSet
  )}${wordBoundaryAfter})|${or(thanksUnwrappable)})`,
  'gui'
);

const noThanksRegex = new RegExp(
  String.raw`(?<!\/)((?:${wordBoundaryBefore}${or(
    wrapNoThanksSet
  )}${wordBoundaryAfter})|${or(noThanksUnwrappable)})`,
  'gui'
);

const hasThanks = str => {
  thanksRegex.lastIndex = -1;
  return thanksRegex.exec(
    removeDiacritics(str).replace(/\s+/u, ' ').replace(noThanksRegex, '')
  );
};
const keywordValidator = (str: string): boolean => {
  return Boolean(hasThanks(str));
};

export default keywordValidator;
