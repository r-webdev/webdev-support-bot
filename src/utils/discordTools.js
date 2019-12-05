const { providers } = require('./urlTools');

/**
 *
 * @param {string} title
 * @param {string} url
 */
const createMarkdownLink = (title, url) =>
  `[${title}](${url.replace(/\)/g, '\\)')})`;

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
      },
    };
  }

  throw new Error('provider not implemented');
};

module.exports = {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
};
