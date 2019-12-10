const { providers } = require('./urlTools');
// eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');

/**
 *
 * @param {string} title
 * @param {string} url
 */
const createMarkdownLink = (title, url) =>
  `[${title}](${url.replace(/\)/g, '\\)')})`;

const BASE_DESCRIPTION = `
:bulb: *react with a number (:one:, :two:, ...) to filter your result*
:neutral_face: *react with ❌ or ✖️ to delete*
:point_up: *supports !npm, !composer, !mdn and !caniuse*
:gear: *issues? feature requests? head over to ${createMarkdownLink(
  'github',
  process.env.REPO_LINK,
)}*`;

/**
 *
 * @param {string} provider
 * @param {string} searchTerm
 * @param {string} url
 * @param {string} footerText
 * @param {string} description
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
 * @param {string} provider
 * @param {string} title
 * @param {string} url
 * @param {string} footerText
 * @param {string} description
 * @param {array} fields
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

/**
 *
 * @param {Message} msg
 * @param {number} timeout
 */
const delayedAutoDeleteMessage = (msg, timeout = 30 * 1000) => {
  setTimeout(() => {
    msg.delete();
  }, timeout);
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
 * @param {array} items
 */
const createDescription = items => items.concat(BASE_DESCRIPTION).join('\n');

module.exports = {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  delayedAutoDeleteMessage,
  adjustDescriptionLength,
  createMarkdownListItem,
  createDescription,
};
