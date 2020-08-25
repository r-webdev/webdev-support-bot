const abbreviations = ['ty', 'tyvm', 'thanks', 'thx', 'tnx', 'thank', 'thnaks'];

const regex = new RegExp(
  abbreviations.map(item => String.raw`\b${item}\b`).join('|'),
  'i'
);

const keywordValidator = (msg: string) => {
  return Boolean(msg.match(regex));
};

export default keywordValidator;
