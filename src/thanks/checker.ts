const abbreviations = ['ty', 'tyvm', 'thanks', 'thx', 'tnx', 'thank', 'thnaks'];

const thanksRegex = new RegExp(
  String.raw`\b(?<!no|n|no |n |/)\b(?:${abbreviations.join('|')})\b`,
  'i'
);

const keywordValidator = (str: string) => {
  return Boolean(str.match(thanksRegex));
};

export default keywordValidator;
