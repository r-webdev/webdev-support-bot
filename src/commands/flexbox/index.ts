import { Message } from 'discord.js';

const handleFlexboxCommand = async (msg: Message) => {
  await msg.channel.send(`**Useful Resources to learn about Flexbox:**
  
1. Flexbox Froggy, Interactive Tutorial: <https://flexboxfroggy.com/#de>
2. Flexbox Guide, Text Guide: <https://css-tricks.com/snippets/css/a-guide-to-flexbox/>
3. What The Flexbox, Video Course: <https://flexbox.io/>`);
};

export default handleFlexboxCommand;
