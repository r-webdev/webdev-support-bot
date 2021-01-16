import { Message } from 'discord.js';

import { warning } from '../../utils/emojis';

const sites = [
  `<https://codepen.io/> - ${warning} requires account`,
  'https://codesandbox.io/',
  '<https://repl.it/>',
  '<https://ideone.com/>',
  '<https://jsfiddle.net/>',
].join('\n');

const handleCodeRequest = async (msg: Message) => {
  await msg.channel.send(`
It would be much easier to help you if we could see (parts) of your code!
Try reproducing your issue on one of these sites, save and then link it here:

${sites}

Sometimes trying to recreate a problem outside of your project already helps you tracking down the issue on your own.
`);
};

export default handleCodeRequest;
