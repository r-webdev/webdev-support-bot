import type { Message } from 'discord.js';

import { createCodeBlockCapturer } from '../../utils/codeBlockCapturer.js';
import { pipe } from '../../utils/pipe.js';
import { pluck } from '../../utils/pluck.js';
import { some } from '../../utils/some.js';
import { hasVarInSource } from './hasVarInSource.js';

const jsCodeBlocks = createCodeBlockCapturer([
  'js',
  'javascript',
  'ts',
  'typescript',
]);

const tap = <T>(x: T): T => {
  console.log(x)
  return x
}
const getFirstVar = pipe([jsCodeBlocks, pluck('code'), some(hasVarInSource)]);

const messageFor = (userId: string) => `
Hey <@${userId}>, I've noticed you're using \`var\` in a code snippet.
Unless you've got a very good reason to, it's highly recommended that you use \`let\` or \`const\`. Preferably \`const\` if it won't be reassigned.`;

export function detectVar(msg: Message): boolean {
  if (msg.author.id === msg.client.user.id) {
    return;
  }

  console.log(msg.content, msg.cleanContent)

  const { content, channel, author } = msg;

  if (getFirstVar(content)) {
    channel.send(messageFor(author.id));
    return true;
  }
}
