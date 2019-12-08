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
  },
  composer: {
    search: `https://packagist.org/search.json?q=${SEARCH_TERM}`,
    direct: TERM,
    color: 0xf28d1a,
    createTitle: searchTerm => `Packagist results for ${searchTerm}`,
    icon: 'https://packagist.org/bundles/packagistweb/img/logo-small.png',
    keyword: 'composer',
    getExtendedInfoUrl: package =>
      `https://packagist.org/packages/${package}.json`,
  },
  caniuse: {
    search: `https://caniuse.com/process/query.php?search=${SEARCH_TERM}`,
    direct: `https://caniuse.com/#feat=${TERM}`,
    color: 0xdb5600,
    createTitle: searchTerm => `CanIUse results for ${searchTerm}`,
    icon: 'https://caniuse.com/img/favicon-128.png',
    keyword: 'caniuse',
    getExtendedInfoUrl: text =>
      `https://caniuse.com/process/get_feat_data.php?type=support-data&feat=${text}`,
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
 * @returns {string}
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

/**
 *
 * @param {string} provider
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

module.exports = {
  providers,
  getSearchUrl,
  KEYWORD_REGEXP,
  buildDirectUrl,
  getExtendedInfoUrl,
};
