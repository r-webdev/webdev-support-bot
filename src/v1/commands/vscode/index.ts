import { Message, GuildEmoji } from 'discord.js';

import { light } from '../../utils/emojis';

const createMessage = (vsCodeIcon: GuildEmoji) =>
  [
    `> ${light} consider using a lightweight, customizeable and monthly updated editor such as`,
    '> ',
    vsCodeIcon
      ? `> ${vsCodeIcon} Visual Studio Code - <https://code.visualstudio.com/>`
      : '> Visual Studio Code - <https://code.visualstudio.com/>',
    '> ',
    "> It's free & available cross platform and next to WebStorm the go to editor in this industry.",
  ].join('\n');

const handleVSCodeRequest = async (msg: Message) => {
  const vsCodeIcon = msg.client.emojis.cache.find(
    emoji => emoji.name === 'vscode'
  );

  await msg.channel.send(createMessage(vsCodeIcon));
};

export default handleVSCodeRequest;
