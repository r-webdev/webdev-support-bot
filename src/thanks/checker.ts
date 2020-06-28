const abbreviations = [
  'thanks',
  'ty',
  'thx',
  'tnx',
  'tyvm',
  'thank you',
  'thank',
];

export default (msg: String) => abbreviations.find(a => msg.includes(a));
