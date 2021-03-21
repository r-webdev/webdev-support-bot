import type { Message } from 'discord.js';

import { createCodeBlockCapturer } from '../../utils/codeBlockCapturer';
import { pipe } from '../../utils/pipe';
import { pluck } from '../../utils/pluck';
import { some } from '../../utils/some';
import { hasVarInSource } from './hasVarInSource';

const jsCodeBlocks = createCodeBlockCapturer([
  'js',
  'javascript',
  'ts',
  'typescript',
]);

const getFirstVar = pipe([jsCodeBlocks, pluck('code'), some(hasVarInSource)]);

const messageFor = (userId: string) => `
Hey <@${userId}>, I've noticed you're using \`var\` in a code snippet.
Unless you've got a very good reason to, it's highly recommend you use \`let\` or \`const\`, preferring \`const\` if it won't be reassigned.
`;

export function detectVar(msg: Message): boolean {
  if (msg.author.id === msg.client.user.id) {
    return;
  }

  const { content, channel, author } = msg;

  if (getFirstVar(content)) {
    channel.send(messageFor(author.id), {});
    return true;
  }
}
