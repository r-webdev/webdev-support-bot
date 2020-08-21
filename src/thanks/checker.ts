const abbreviations = new Set([
  'ty',
  'thanks',
  'thx',
  'tnx',
  'tyvm',
  'thank',
  'thnaks',
]);

const keywordValidator = (msg: string) => {
  const fragments = msg.toLowerCase().split(' ');

  return fragments.some(fragment => abbreviations.has(fragment));
};

export default keywordValidator;
