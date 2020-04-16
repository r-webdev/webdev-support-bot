const { noResults, invalidResponse } = require('./errors');
const useData = require('./useData');
const delayedMessageAutoDeletion = require('./delayedMessageAutoDeletion');

const SEARCH_TERM = '%SEARCH%';
const TERM = '%TERM%';

const providers = {
  mdn: {
    search: `https://developer.mozilla.org/en-US/search?q=${SEARCH_TERM}`,
    direct: `https://developer.mozilla.org${TERM}`,
    color: 0x83d0f2,
    createTitle: (searchTerm) => `MDN results for *${searchTerm}*`,
    icon: 'https://avatars0.githubusercontent.com/u/7565578',
    help: '!mdn localStorage',
  },
  npm: {
    search: `https://www.npmjs.com/search/suggestions?q=${SEARCH_TERM}`,
    color: 0xfb3e44,
    createTitle: (searchTerm) => `NPM results for *${searchTerm}*`,
    icon: 'https://avatars0.githubusercontent.com/u/6078720',
    help: '!npm react',
  },
  composer: {
    search: `https://packagist.org/search.json?q=${SEARCH_TERM}`,
    direct: `https://packagist.org/packages/${TERM}`,
    color: 0xf28d1a,
    createTitle: (searchTerm) => `Packagist results for ${searchTerm}`,
    icon: 'https://packagist.org/bundles/packagistweb/img/logo-small.png',
    getExtendedInfoUrl: (package) =>
      `https://packagist.org/packages/${package}.json`,
    help: '!composer sentry',
  },
  caniuse: {
    search: `https://caniuse.com/process/query.php?search=${SEARCH_TERM}`,
    direct: `https://caniuse.com/#feat=${TERM}`,
    color: 0xdb5600,
    createTitle: (searchTerm) => `CanIUse results for *${searchTerm}*`,
    icon: 'https://caniuse.com/img/favicon-128.png',
    getExtendedInfoUrl: (text) =>
      `https://caniuse.com/process/get_feat_data.php?type=support-data&feat=${text}`,
    help: '!caniuse IntersectionObserver',
  },
  github: {
    search: `https://api.github.com/search/repositories?q=${SEARCH_TERM}`,
    direct: `https://github.com/${TERM}`,
    color: 0x24292e,
    createTitle: (searchTerm) => `GitHub results for *${searchTerm}*`,
    icon:
      'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    help: '!github react',
  },
  bundlephobia: {
    search: `https://api.npms.io/v2/search/suggestions?q=${SEARCH_TERM}`,
    direct: `https://bundlephobia.com/result?p=${TERM}`,
    color: 0xffffff,
    createTitle: (searchTerm) => `Bundlephobia results for *${searchTerm}*`,
    getExtendedInfoUrl: (package) =>
      `https://bundlephobia.com/api/size?package=${package}&record=true`,
    icon: 'https://bundlephobia.com/android-chrome-192x192.png',
    help: '!bundlephobia @chakra-ui/core',
  },
  spam: {
    color: 0xffffff,
    icon:
      'https://github.com/ljosberinn/webdev-support-bot/blob/master/logo.png?raw=true',
  },
};

const HELP_KEYWORD = '--help';

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
 * @param {'mdn' | 'caniuse' | 'composer' | 'npm' | 'github' | 'bundlephobia'} provider
 * @param {string} search
 *
 * @returns {string}
 */
const getSearchUrl = (provider, search) => {
  if (providers[provider]) {
    return providers[provider].search.replace(SEARCH_TERM, encodeURI(search));
  }

  throw new Error(`provider not implemeted: ${provider}`);
};

/**
 * @param {'mdn' | 'caniuse' | 'composer' | 'npm' | 'github' | 'bundlephobia'} provider
 * @param {string} href
 */
const buildDirectUrl = (provider, href) => {
  if (providers[provider]) {
    return providers[provider].direct.replace(TERM, href);
  }

  throw new Error(`provider not implemeted: ${provider}`);
};

/**
 *
 * @param {'mdn' | 'caniuse' | 'composer' | 'npm' | 'github' | 'bundlephobia'} provider
 * @param {string} term
 *
 * @returns {string}
 */
const getExtendedInfoUrl = (provider, term) => {
  if (providers[provider] && providers[provider].getExtendedInfoUrl) {
    return providers[provider].getExtendedInfoUrl(term);
  }

  throw new Error(
    `provider or provider.getExtendedInfoUrl not implemented at provider: ${provider}`,
  );
};

/**
 *
 * @param {{
 *   msg: import('discord.js').Message,
 *   provider: 'caniuse' | 'composer' | 'mdn' | 'npm' | 'github' | 'bundlephobia',
 *   searchTerm: string,
 *   invalidData: (str: string) => boolean,
 *   sanitizeData?: (data: any) => any,
 *   headers?: Headers
 * }}
 *
 * @returns Promise<array|object|string>
 */
const getData = async ({
  msg,
  provider,
  searchTerm,
  sanitizeData,
  isInvalidData,
  headers,
}) => {
  const searchUrl = getSearchUrl(provider, searchTerm);
  const { error, json: data } = await useData(searchUrl, 'json', {
    headers,
  });

  if (error) {
    await msg.reply(invalidResponse);
    return;
  }

  const sanitizedData = sanitizeData ? sanitizeData(data) : data;

  if (isInvalidData(sanitizedData)) {
    const sentMessage = await msg.reply(noResults(searchTerm));

    delayedMessageAutoDeletion(sentMessage);
    return;
  }

  return sanitizedData;
};

module.exports = {
  providers,
  getSearchUrl,
  KEYWORD_REGEXP,
  buildDirectUrl,
  HELP_KEYWORD,
  getExtendedInfoUrl,
  getData,
};
