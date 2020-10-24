import thanks from './thanks';
import thankyou from './thankyou';
import nothanks from './nothanks';
import nothankyou from './nothankyou';

type ThankDef = typeof thanks[number];

const english = ['ty', 'tyvm', 'thanks', 'thx', 'tnx', 'thank', 'thnaks'];
const negativeEnglish = english
  .flatMap(word => ['n ' + word, 'n' + word, 'no' + word, 'no ' + word])
  .concat(['no need to thank', 'thanks,? but no thanks']);

const textFromDef = (def: ThankDef) =>
  removeDiacritics(def.text.toLocaleLowerCase(def.symbol));
const removeDiacritics = (str: string) =>
  str.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const thanksSet = new Set([
  ...english,
  ...thanks.map(textFromDef),
  ...thankyou.map(textFromDef),
]);
const noThanksSet = new Set([
  ...nothanks.map(textFromDef),
  ...nothankyou.map(textFromDef),
  ...negativeEnglish,
]);

const thanksRegex = new RegExp(
  String.raw`\b(?<!\/)(${[...thanksSet].join('|')})\b`,
  'gui'
);
const noThanksRegex = new RegExp(
  String.raw`\b(${[...noThanksSet].join('|')})\b`,
  'gui'
);
const hasThanks = str =>
  removeDiacritics(str)
    .replace(/\s+/, ' ')
    .replace(noThanksRegex, '')
    .match(thanksRegex);

const keywordValidator = (str: string) => {
  return hasThanks;
};

export default keywordValidator;
