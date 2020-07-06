// const abbreviations = [
//   'thanks',
//   'ty',
//   'thx',
//   'tnx',
//   'tyvm',
//   'thank you',
//   'thank',
// ];

// export default (msg: string) => abbreviations.find(a => msg.includes(a));

const abbreviations = /^(ty)|(thanks)|(thx)|(tnx)|(tyvm)|(thank)$/g;

const keywordValidator = (msg: string) => abbreviations.test(msg);

export default keywordValidator;
