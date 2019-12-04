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
const createEmbed = ({
  provider,
  searchTerm,
  url,
  footerText,
  description,
}) => {
  if (providers[provider]) {
    const { createTitle, color, icon } = providers[provider];

    return {
      embed: {
        title: createTitle(searchTerm),
        color,
        url: url.substr(0, 2048),
        footer: {
          icon_url: icon,
          text: footerText,
        },
        description,
      },
    };
  }

  throw new Error('provider not implemented');
};

module.exports = {
  createMarkdownLink,
  createEmbed,
};
