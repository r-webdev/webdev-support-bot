import { Message } from 'discord.js';

const linebreakPattern = /\n/gim;

export const generateCleanContent = (msg: Message) =>
  msg.cleanContent.replace(linebreakPattern, ' ').toLowerCase();

export const stripMarkdownQuote = (msg: string) => msg.replace(/^> .+$/gm, '');
