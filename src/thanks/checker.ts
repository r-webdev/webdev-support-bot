import thanks from './thanks';
import thankyou from './thankyou';
import nothanks from './nothanks';
import nothankyou from './nothankyou';
import { map } from '../utils/map';

type ThankDef = typeof thanks[number];

const wordBoundarableRegex = /\p{Changes_When_Uppercased}|\p{Changes_When_Lowercased}/u;
const english = ['ty', 'tyvm', 'thanks', 'thx', 'tnx', 'thank', 'thnaks'];
const negativeEnglish = english
  .flatMap(word => ['n ' + word, 'n' + word, 'no' + word, 'no ' + word])
  .concat(['no need to thank', 'thanks,? but no thanks']);

const mapWordBoundary = map((str: string) =>
  wordBoundarableRegex.test(str) ? String.raw`\b${str}\b` : str
);

const mapTextFromDefs = map((def: ThankDef) =>
  removeDiacritics(def.text.toLocaleLowerCase(def.symbol))
);

const removeDiacritics = (str: string) =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const thanksSet = new Set([
  ...english,
  ...mapTextFromDefs(thanks),
  ...mapTextFromDefs(thankyou),
]);
const noThanksSet = new Set([
  ...negativeEnglish,
  ...mapTextFromDefs(nothanks),
  ...mapTextFromDefs(nothankyou),
]);

const thanksRegex = new RegExp(
  String.raw`(?<!\/)(${[...mapWordBoundary(thanksSet)].join('|')})`,
  'gui'
);
const noThanksRegex = new RegExp(
  String.raw`(${[...mapWordBoundary(noThanksSet)].join('|')})`,
  'gui'
);
const hasThanks = str =>
  removeDiacritics(str)
    .replace(/\s+/, ' ')
    .replace(noThanksRegex, '')
    .match(thanksRegex);

const keywordValidator = (str: string) => {
  return Boolean(hasThanks(str));
};

export default keywordValidator;
