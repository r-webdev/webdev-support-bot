const abbreviations = new Set(['ty', 'thanks', 'thx', 'tnx', 'tyvm', 'thank']);

const keywordValidator = (msg: string) => {
  const fragments = msg.split(' ');

  return fragments.some(fragment => abbreviations.has(fragment));
};

export default keywordValidator;
