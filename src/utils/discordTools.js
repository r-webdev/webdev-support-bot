const { providers } = require('./urlTools');
const {
  reactionFilterBuilder,
  awaitReactionConfig,
  validReactions,
} = require('./reactions');
const delayedMessageAutoDeletion = require('./delayedMessageAutoDeletion');
const { unknownError } = require('./errors');
const emojis = require('./emojis');
/**
 *
 * @param {string} title
 * @param {string} url
 */
const createMarkdownLink = (title, url) =>
  `[${title}](${url.replace(/\)/g, '\\)')})`;

const BASE_DESCRIPTION = `
${emojis.light} *react with a number (:one:, :two:, ...) to filter your result*
${emojis.neutral_face} *react with \`❌\` to delete*
${
  emojis.point_up
} *supports \`!mdn\`, \`!github\`, \`!caniuse\`, \`!npm\` and \`!composer\`*
${emojis.gear} *issues? feature requests? head over to ${createMarkdownLink(
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
 * @param {string} title
 */
const adjustTitleLength = title => {
  const titleLength = title.length;

  const cleansedTitle =
    titleLength > DESCRIPTION_LENGTH_LIMIT
      ? title.substr(0, DESCRIPTION_LENGTH_LIMIT - SEPARATOR_LENGTH) + '...'
      : title;

  return cleansedTitle.replace(/\n/gm, ' ');
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
 * @param {{reactions: import('discord.js').Collection<string, import('discord.js').MessageReaction>}} reactions
 * @param {string} id
 * @param {string[]} currentlyValidEmojis
 *
 */
const findEarlyReaction = ({ reactions }, id, currentlyValidEmojis) =>
  reactions.find(
    ({ users, emoji: { name } }) =>
      currentlyValidEmojis.includes(name) && users.find(user => user.id === id),
  );

/**
 *
 * @param {{
 *  reactions: import('discord.js').Collection<string, import('discord.js').MessageReaction>,
 *  author: import('discord.js').User}
 * } reactions
 */
const clearReactions = ({ reactions, author }) => {
  let isSubscribed = true;

  reactions.forEach(reaction => {
    reaction.users
      .filter(user => user.bot && user.id === author.id)
      .forEach(user => {
        reaction.remove(user).catch(() => {
          if (isSubscribed) {
            console.info(
              'Attempting to remove reactions: message probably deleted.',
            );
            isSubscribed = false;
          }
        });
      });
  });
};

/**
 *
 * @param {import('discord.js').Message} sentMsg
 * @param {import('discord.js').Message} msg
 * @param {array} firstTenResults
 */
const getChosenResult = async (sentMsg, { author: { id } }, results) => {
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
    } catch (error) {
      console.info(
        'Add reaction failed: message was apparently deleted by someone else.',
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

    const index = validReactions.indices.findIndex(
      emoji => emoji === emojiName,
    );

    clearReactions(sentMsg);

    return results[index];
  }

  try {
    const collectedReactions = await sentMsg.awaitReactions(
      reactionFilterBuilder(id, emojis),
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

    clearReactions(sentMsg);

    return results[index];
  } catch (collected) {
    if (!(collected instanceof Map)) {
      console.error(`${collected.name}: ${collected.message}`);
      await attemptEdit(sentMsg, unknownError);
      return;
    }

    // nobody reacted, doesn't matter
  }
};

const EMPTY_FIELD = {
  name: '\u200B',
  value: '\u200B',
};

/**
 *
 * @param {import('discord.js').Message} sentMsg
 * @param {string | array | number} content
 * @param {{ embed: object, code: string | boolean } | { data: object }} options
 */
const attemptEdit = async (sentMsg, content, options = undefined) => {
  try {
    await sentMsg.edit(content, options);
  } catch (error) {
    console.info('Attempting to edit message: message probably deleted.');
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
  EMPTY_FIELD,
  attemptEdit,
  adjustTitleLength,
};
