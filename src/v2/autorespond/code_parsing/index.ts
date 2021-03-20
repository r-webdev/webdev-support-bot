import { Message } from 'discord.js';
import { createCodeBlockCapturer } from '../../utils/codeBlockCapturer';
import { pipe } from '../../utils/pipe';
import { some } from '../../utils/some';
import { pluck } from '../../utils/pluck';
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

export function detectVar(msg: Message) {
  if (msg.author.id === msg.client.user.id) return;

  const content = msg.content;

  if (getFirstVar(content)) {
    msg.channel.send(messageFor(msg.author.id), {});
    return true;
  }
}
