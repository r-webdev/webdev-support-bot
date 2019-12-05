// eslint-disable-next-line no-unused-vars
const { RichEmbed } = require('discord.js');

const SEARCH_TERM = '%SEARCH%';
const TERM = '%TERM%';

const providers = {
  mdn: {
    search: `https://developer.mozilla.org/en-US/search?q=${SEARCH_TERM}`,
    direct: `https://developer.mozilla.org${TERM}`,
    color: 0x83d0f2,
    createTitle: searchTerm => `MDN results for *${searchTerm}*`,
    icon: 'https://avatars0.githubusercontent.com/u/7565578',
    keyword: 'mdn',
  },
  npm: {
    search: `https://www.npmjs.com/search?q=${SEARCH_TERM}`,
    color: 0xfb3e44,
    createTitle: searchTerm => `NPM results for *${searchTerm}*`,
    icon: 'https://avatars0.githubusercontent.com/u/6078720',
    keyword: 'npm',
    getExtendedInfo: package => `https://registry.npmjs.org/${package}/latest`,
  },
  composer: {
    search: SEARCH_TERM,
    direct: TERM,
    color: undefined,
    createTitle: searchTerm => searchTerm,
    icon: undefined,
    keyword: 'composer',
  },
  caniuse: {
    search: SEARCH_TERM,
    direct: TERM,
    color: undefined,
    createTitle: searchTerm => searchTerm,
    icon: undefined,
    keyword: 'caniuse',
  },
};

/**
 * dynamic regExp matching all possible Object.keys(providers) as keyword
 */
const KEYWORD_REGEXP = new RegExp(
  '^!(%PLACEHOLDER%)\\s+'.replace(
    '%PLACEHOLDER%',
    Object.keys(providers)
      .reduce((carry, keyword) => [...carry, keyword], [])
      .join('|'),
  ),
  'i',
);

/**
 *
 * @param {string} provider
 * @param {string} search
 *
 * @returns {RichEmbed}
 */
const getSearchUrl = (provider, search) => {
  if (providers[provider]) {
    return providers[provider].search.replace(SEARCH_TERM, encodeURI(search));
  }

  throw new Error(`provider not implemeted: ${provider}`);
};

/**
 * @param {string} provider
 * @param {string} href
 */
const buildDirectUrl = (provider, href) => {
  if (providers[provider]) {
    return providers[provider].direct.replace(TERM, href);
  }

  throw new Error(`provider not implemeted: ${provider}`);
};

module.exports = {
  providers,
  getSearchUrl,
  KEYWORD_REGEXP,
  buildDirectUrl,
};
