const abbreviations = /^(ty)|(thanks)|(thx)|(tnx)|(tyvm)|(thank)$/g;

const keywordValidator = (msg: string) => {
  const fragments = msg.split(' ');

  return fragments.some(fragment => abbreviations.test(fragment));
};

export default keywordValidator;
