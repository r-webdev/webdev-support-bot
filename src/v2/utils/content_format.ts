import type { Message } from 'discord.js';

const linebreakPattern = /\n/gimu;

export const generateCleanContent = (msg: Message): string =>
  msg.cleanContent.replace(linebreakPattern, ' ').toLowerCase();

export const stripMarkdownQuote = (msg: string): string =>
  msg.replace(/^> .+$/gmu, '');
