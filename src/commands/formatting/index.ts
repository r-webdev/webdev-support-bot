import { Message } from 'discord.js';

import { point_up, paintbrush } from '../../utils/emojis';
import { LINE_SEPARATOR, exampleFns } from './exampleFns';

const getRandomArbitrary = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getSnippetElements = () =>
  [
    '> \\`\\`\\`js',
    '> // copy this and enter your code instead',
    exampleFns[getRandomArbitrary(0, exampleFns.length - 1)]
      .toString()
      .split(LINE_SEPARATOR)
      .map(line => `> ${line}`)
      .join(LINE_SEPARATOR),
    '> \\`\\`\\`',
  ].join(LINE_SEPARATOR);

const handleFormattingRequest = async (msg: Message) => {
  await msg.channel.send(`
${point_up} Did you know you can add syntax highlighting to your code in Discord? 

https://cdn.discordapp.com/attachments/550768098660188191/834795086126121010/2021-04-22_10-16-33.gif

${getSnippetElements()}

`);
};

export default handleFormattingRequest;
