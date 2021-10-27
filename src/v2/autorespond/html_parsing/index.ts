import type { Message } from 'discord.js';
import { filter } from 'domyno';

import { createCodeBlockCapturer } from '../../utils/codeBlockCapturer';
import { map } from '../../utils/map';
import { pipe } from '../../utils/pipe';
import { pluck } from '../../utils/pluck';
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
const listFormatter = new Intl.ListFormat();
const s = _({ 1: '' }, 's');
const isA = _({ 1: 'is a', 2: 'are both' }, 'are all');
const mdnLink = ([item]: [any]): string =>
  `<https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${item.toLowerCase()}>`;

export function detectDeprecatedHTML(msg: Message): boolean {
  if (msg.author.id === msg.client.user.id) {
    return;
  }

  const { content, channel, author } = msg;

  const deprecated = [...getDeprecatedElements(content)].flat(1);
  if (deprecated.length) {
    const template = p`Hey <@!${author.id}>, I've noticed you're using ${x =>
      x} deprecated element${s}. ${deprecated.map(
      ([item]) => `\`<${item}>\``
    )} ${isA} deprecated element${s}. Consider reading up on the alternatives here:\n${x =>
      x > 5 ? mdnDeprecatedElUri : deprecated.map(mdnLink).join('\n')}`;
    channel.send(template(deprecated.length));
  }
}

function p(
  strs: TemplateStringsArray,
  ...exprs: (((n: number) => string) | unknown)[]
) {
  return (n: number) =>
    strs.reduce((acc, item, i) => {
      const exp = exprs[i - 1];
      if (Array.isArray(exp)) return acc + listFormatter.format(exp) + item;
      return acc + callOrValue(exp, n) + item;
    });
}

function callOrValue(item: unknown, ...args: unknown[]): unknown {
  if (typeof item === 'function') {
    return item(...args);
  }
  return item;
}

function _(
  map: Record<number, string>,
  defaultStr: string
): (n: number) => string {
  return (n: number) => map[n] ?? defaultStr;
}
