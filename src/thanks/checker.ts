const abbreviations = [
  'thanks',
  'ty',
  'thx',
  'tnx',
  'tyvm',
  'thank you',
  'thank',
];

export default (msg: string) => abbreviations.find(a => msg.includes(a));
