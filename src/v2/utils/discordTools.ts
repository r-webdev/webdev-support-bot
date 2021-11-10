import { MessageEmbed } from 'discord.js';
import type { Message, MessageEditOptions, EmbedField , MessagePayload } from 'discord.js';

import { REPO_LINK } from '../env.js';
import { delayedMessageAutoDeletion } from './delayedMessageAutoDeletion.js';
import { light, neutral_face, point_up, gear } from './emojis.js';
import { unknownError } from './errors.js';
import {
  reactionFilterBuilder,
  awaitReactionConfig,
  validReactions,
} from './reactions.js';
import { providers } from './urlTools.js';

export const createMarkdownLink = (title: string, url: string): string =>
  // eslint-disable-next-line unicorn/prefer-replace-all
  `[${title}](${url.replace(/\)/gu, '\\)')})`;

export const BASE_DESCRIPTION = `
${light} *react with a number (:one:, :two:, ...) to filter your result*
${neutral_face} *react with \`❌\` to delete*
${point_up} *supports \`!mdn\`, \`!github\`, \`!caniuse\`, \`!npm\`, \`!composer\`, \`!bundlephobia\`, and \`!php\`*
${gear} *issues? feature requests? head over to ${createMarkdownLink(
  'github',
  REPO_LINK
)}*`;

export type Provider =
  | 'caniuse'
  | 'npm'
  | 'github'
  | 'composer'
  | 'mdn'
  | 'bundlephobia'
  | 'php';

type ListEmbed = {
  provider: Provider;
  searchTerm: string;
  url: string;
  footerText: string;
  description: string;
};

export const createListEmbed = ({
  provider,
  searchTerm,
  url,
  footerText,
  description,
}: ListEmbed) => {
  if (providers[provider]) {
    const { createTitle } = providers[provider];

    return createEmbed({
      description,
      footerText,
      provider,
      title: createTitle(searchTerm),
      url: url.slice(0, 2048),
    });
  }

  throw new Error('provider not implemented');
};

export type Embed = {
  provider: Provider | 'spam';
  title: string;
  url?: string;
  footerText: string;
  description: string;
  fields?: EmbedField[];
  author?: { name: string; icon_url?: string; url?: string };
};

const spamMeta = {
  color: 0xfe_5f_55,
  icon:
    'https://github.com/ljosberinn/webdev-support-bot/blob/master/logo.png?raw=true',
};

export const createEmbed = ({
  provider,
  title,
  url = null,
  footerText,
  description,
  fields = [],
  author = null,
}: Embed): { embed: MessageEmbed } => {
  const isSpam = provider === 'spam';

  if (isSpam || providers[provider]) {
    const { color, icon } = isSpam ? spamMeta : providers[provider];

    return {
      embed: new MessageEmbed({
        author,
        color,
        description,
        fields,
        footer: {
          iconURL: icon,
          text: footerText,
        },
        title,
        url,
      }),
    };
  }

  throw new Error('provider not implemented');
};

const DESCRIPTION_LENGTH_LIMIT = 72;
const SEPARATOR_LENGTH = 3;

/**
 * Cuts off the description of a package name
 * based on the maximum of possible characters before
 * a linebreak occurs, keeping words intact.
 *
 */
export const adjustDescriptionLength = (
  position: number,
  name: string,
  description: string
) => {
  const positionLength = position.toString().length + 2;
  const nameLength = name.length;
  const descriptionLength = description.length;

  const currentLength =
    positionLength + nameLength + SEPARATOR_LENGTH + descriptionLength;

  if (currentLength > DESCRIPTION_LENGTH_LIMIT) {
    const availableSpace =
      DESCRIPTION_LENGTH_LIMIT - positionLength - nameLength - SEPARATOR_LENGTH;

    let hasHitLimit = false;

    const shortenedDescription = description
      .split(' ')
      .reduce((carry: string, part: string) => {
        if (hasHitLimit || carry.length + part.length > availableSpace) {
          hasHitLimit = true;
          return carry;
        }

        if (carry.length === 0) {
          return part;
        }

        return [carry, part].join(' ');
      }, '');

    return `${shortenedDescription}...`;
  }

  return description;
};

export const adjustTitleLength = (title: string) => {
  const titleLength = title.length;

  const cleansedTitle =
    titleLength > DESCRIPTION_LENGTH_LIMIT
      ? `${title.slice(
          0,
          Math.max(0, DESCRIPTION_LENGTH_LIMIT - SEPARATOR_LENGTH)
        )}...`
      : title;

  return cleansedTitle.replace(/\n/gm, ' ');
};

export const createMarkdownListItem = (index: number, content: string) =>
  `${index + 1}. ${content}`;

export const createMarkdownBash = (string: string) =>
  ['```bash', string, '```'].join('\n');

export const createMarkdownCodeBlock = (string: string, language = '') =>
  [`\`\`\`${language}`, string, '```'].join('\n');

export const createDescription = (items: unknown[]): string =>
  [...items, BASE_DESCRIPTION].join('\n');

export const findEarlyReaction = (
  { reactions }: Message,
  id: string,
  currentlyValidEmojis: string[]
) =>
  reactions.cache.find(
    ({ users, emoji: { name } }) =>
      currentlyValidEmojis.includes(name) &&
      !!users.cache.find(user => user.id === id)
  );

export const clearReactions = ({ reactions }: Message) =>
  reactions.removeAll().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    // eslint-disable-next-line no-console
    console.info(
      'Attempting to remove reactions: message probably deleted or insufficient rights.'
    );
  });

export const getChosenResult = async <T>(
  sentMsg: Message,
  { author: { id } }: { author: { id: string } },
  results: T[]
): Promise<T> => {
  let earlyReaction = null;

  const emojis = [
    ...(results.length < 10
      ? [...validReactions.indices].splice(0, results.length)
      : validReactions.indices),
    validReactions.deletion,
  ];

  for (const emoji of emojis) {
    earlyReaction = findEarlyReaction(sentMsg, id, emojis);

    if (earlyReaction) {
      break;
    }

    try {
      await sentMsg.react(emoji);
    } catch {
      // eslint-disable-next-line no-console
      console.info(
        'Add reaction failed: message was apparently deleted by someone else.'
      );
      return;
    }
  }

  if (earlyReaction) {
    const emojiName = earlyReaction.emoji.name;

    if (validReactions.deletion === emojiName) {
      delayedMessageAutoDeletion(sentMsg, 1);
      return;
    }

    const index = validReactions.indices.indexOf(emojiName);

    clearReactions(sentMsg);

    return results[index];
  }

  try {
    const collectedReactions = await sentMsg.awaitReactions({
     filter: reactionFilterBuilder(id, emojis),
     ...awaitReactionConfig
    });

    const emojiName = collectedReactions.first().emoji.name;

    if (validReactions.deletion === emojiName) {
      delayedMessageAutoDeletion(sentMsg, 1);
      return;
    }

    const index = validReactions.indices.indexOf(emojiName);

    clearReactions(sentMsg);

    return results[index];
  } catch (error) {
    if (!(error instanceof Map)) {
      // eslint-disable-next-line no-console
      console.error(`${error.name}: ${error.message}`);
      await attemptEdit(sentMsg, unknownError);
    }

    // nobody reacted, doesn't matter
  }
};

export const EMPTY_FIELD: EmbedField = {
  inline: true,
  name: '\u200B',
  value: '\u200B',
};

export const attemptEdit = async (
  sentMsg: Message,
  content: string | MessageEditOptions | MessagePayload
): Promise<void> => {
  try {
    await sentMsg.edit(content);
  } catch {
    // eslint-disable-next-line no-console
    console.info('Attempting to edit message: message probably deleted.');
  }
};
