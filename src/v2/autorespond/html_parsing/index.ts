import type { Message } from 'discord.js';
import { filter } from 'domyno';

import { createCodeBlockCapturer } from '../../utils/codeBlockCapturer';
import { map } from '../../utils/map';
import { pipe } from '../../utils/pipe';
import { pluck } from '../../utils/pluck';
import { _ } from '../../utils/pluralize';
import { some } from '../../utils/some';
import { hasDeprecatedHTMLElementInSource } from './hasDeprecated';

const jsCodeBlocks = createCodeBlockCapturer(['html']);

const getDeprecatedElements = pipe([
  jsCodeBlocks,
  pluck('code'),
  map(hasDeprecatedHTMLElementInSource),
  filter(Boolean),
]);

const mdnDeprecatedElUri =
  '<https://developer.mozilla.org/en-US/docs/Web/HTML/Element#obsolete_and_deprecated_elements';
const isA = _.mapper({ 1: 'is a', 2: 'are both' }, 'are all');
const mdnLink = ([item]: [any]): string =>
  `<https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${item.toLowerCase()}>`;

export function detectDeprecatedHTML(msg: Message): boolean {
  if (msg.author.id === msg.client.user.id) {
    return;
  }

  const { content, channel, author } = msg;

  const deprecated = [...getDeprecatedElements(content)].flat(1);
  if (deprecated.length) {
    const deprecatedTags = deprecated.map(([item]) => `\`<${item}>\``);
    const template = _`Hey <@!${author.id}>, I've noticed you're using ${
      _.n
    } deprecated element${_.s}. ${deprecatedTags} ${isA} deprecated element${
      _.s
    }. Consider reading up on the alternatives here:\n${x =>
      x > 5 ? mdnDeprecatedElUri : deprecated.map(mdnLink).join('\n')}`;
    channel.send(template(deprecated.length));
  }
}
