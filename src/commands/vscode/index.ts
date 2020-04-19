import { Message } from 'discord.js';
import { light } from '../../utils/emojis';

const message = `
${light} consider using a lightweight, customizeable and monthly updated editor such as

:vscode: Visual Studio Code - <https://code.visualstudio.com/>

It's free & available cross platform and next to WebStorm the go to editor in this industry.
`;

const handleVSCodeRequest = async (msg: Message) => {
  await msg.channel.send(message);
};

export default handleVSCodeRequest;
