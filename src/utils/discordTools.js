const { providers } = require('./urlTools');
// eslint-disable-next-line no-unused-vars
const { Message, Collection, MessageReaction } = require('discord.js');
const {
  reactionFilterBuilder,
  awaitReactionConfig,
  validReactions,
  reactionCache,
} = require('./reactions');
const delayedMessageAutoDeletion = require('./delayedMessageAutoDeletion');
const { unknownError } = require('./errors');
/**
 *
 * @param {string} title
 * @param {string} url
 */
const createMarkdownLink = (title, url) =>
  `[${title}](${url.replace(/\)/g, '\\)')})`;

const BASE_DESCRIPTION = `
:bulb: *react with a number (:one:, :two:, ...) to filter your result*
:neutral_face: *react with \`❌\` to delete*
:point_up: *supports \`!mdn\`, \`!github\`, \`!caniuse\`, \`!npm\` and \`!composer\`*
:gear: *issues? feature requests? head over to ${createMarkdownLink(
  'github',
  process.env.REPO_LINK,
)}*`;

/**
 *
 * @param {{
 *   provider: 'caniuse' | 'mdn' | 'composer' | 'npm',
 *   searchTerm: string,
 *   url: string,
 *   footerText: string,
 *   description: string,
 * }}
 */
const createListEmbed = ({
  provider,
  searchTerm,
  url,
  footerText,
  description,
}) => {
  if (providers[provider]) {
    const { createTitle } = providers[provider];

    return createEmbed({
      provider,
      title: createTitle(searchTerm),
      url: url.substr(0, 2048),
      footerText,
      description,
    });
  }

  throw new Error('provider not implemented');
};

/**
 *
 * @param {{
 *   provider: 'caniuse' | 'npm' | 'github' | 'composer' | 'mdn',
 *   title: string,
 *   url: string,
 *   footerText: string,
 *   description: string,
 *   fields: {name: string, value: string, inline?: boolean}[],
 *   author?: { name: string, icon_url: string, url: string }
 * }} param0
 */
const createEmbed = ({
  provider,
  title,
  url,
  footerText,
  description,
  fields = [],
  author = null,
}) => {
  if (providers[provider]) {
    const { color, icon } = providers[provider];

    return {
      embed: {
        title,
        color,
        url,
        footer: {
          icon_url: icon,
          text: footerText,
        },
        description,
        fields,
        author,
      },
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
 * @param {number} position
 * @param {string} name
 * @param {string} description
 */
const adjustDescriptionLength = (position, name, description) => {
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
      .reduce((carry, part) => {
        if (hasHitLimit || carry.length + part.length > availableSpace) {
          hasHitLimit = true;
          return carry;
        }

        if (carry.length === 0) {
          return part;
        }

        return [carry, part].join(' ');
      }, '');

    return shortenedDescription + '...';
  }

  return description;
};

/**
 *
 * @param {number} index
 * @param {string} content
 */
const createMarkdownListItem = (index, content) => `${index + 1}. ${content}`;

/**
 *
 * @param {string} string
 */
const createMarkdownBash = string => ['```bash', string, '```'].join('\n');

/**
 *
 * @param {array} items
 */
const createDescription = items => items.concat(BASE_DESCRIPTION).join('\n');

/**
 *
 * @param {{reactions: Collection<string, MessageReaction>}} reactions
 * @param {string} id
 *
 */
const findEarlyReaction = ({ reactions }, id) =>
  reactions.find(
    ({ users, emoji: { name } }) =>
      reactionCache.includes(name) && users.find(user => user.id === id),
  );

/**
 *
 * @param {Message} sentMsg
 * @param {Message} msg
 * @param {array} firstTenResults
 */
const getChosenResult = async (sentMsg, { author: { id } }, results) => {
  let earlyReaction = null;

  for (const emoji of reactionCache) {
    earlyReaction = findEarlyReaction(sentMsg, id);

    if (earlyReaction) {
      break;
    }

    await sentMsg.react(emoji);
  }

  if (earlyReaction) {
    const emojiName = earlyReaction.emoji.name;

    if (validReactions.deletion === emojiName) {
      delayedMessageAutoDeletion(sentMsg, 1);
      return;
    }

    const index = validReactions.indices.findIndex(
      emoji => emoji === emojiName,
    );

    return results[index];
  }

  try {
    const collectedReactions = await sentMsg.awaitReactions(
      reactionFilterBuilder(id),
      awaitReactionConfig,
    );

    const emojiName = collectedReactions.first().emoji.name;

    if (validReactions.deletion === emojiName) {
      delayedMessageAutoDeletion(sentMsg, 1);
      return;
    }

    const index = validReactions.indices.findIndex(
      emoji => emoji === emojiName,
    );

    return results[index];
  } catch (collected) {
    if (!(collected instanceof Map)) {
      console.error(`${collected.name}: ${collected.message}`);
      await sentMsg.edit(unknownError);
      return;
    }

    // nobody reacted, doesn't matter
  }
};

module.exports = {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  adjustDescriptionLength,
  createMarkdownListItem,
  createDescription,
  getChosenResult,
  createMarkdownBash,
};
