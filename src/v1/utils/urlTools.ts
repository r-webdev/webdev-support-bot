import { Message } from 'discord.js';
import { HeadersInit } from 'node-fetch';

import { delayedMessageAutoDeletion } from './delayedMessageAutoDeletion';
import { Provider } from './discordTools';
import { noResults, invalidResponse } from './errors';
import useData from './useData';

const SEARCH_TERM = '%SEARCH%';
const TERM = '%TERM%';

type ProviderMap = {
  [key in Provider]: {
    search: string;
    color: number;
    createTitle: (term: string) => string;
    icon: string;
    help: string;
    direct?: string;
    getExtendedInfoUrl?: (pkg: string) => string;
  };
};

export const providers: ProviderMap = {
  bundlephobia: {
    color: 0xffffff,
    createTitle: (searchTerm: string) =>
      `Bundlephobia results for *${searchTerm}*`,
    direct: `https://bundlephobia.com/result?p=${TERM}`,
    getExtendedInfoUrl: (pkg: string) =>
      `https://bundlephobia.com/api/size?package=${pkg}&record=true`,
    help: '!bundlephobia @chakra-ui/core',
    icon: 'https://bundlephobia.com/android-chrome-192x192.png',
    search: `https://api.npms.io/v2/search/suggestions?q=${SEARCH_TERM}`,
  },
  caniuse: {
    color: 0xdb5600,
    createTitle: (searchTerm: string) => `CanIUse results for *${searchTerm}*`,
    direct: `https://caniuse.com/#feat=${TERM}`,
    getExtendedInfoUrl: (text: string) =>
      `https://caniuse.com/process/get_feat_data.php?type=support-data&feat=${text}`,
    help: '!caniuse IntersectionObserver',
    icon: 'https://caniuse.com/img/favicon-128.png',
    search: `https://caniuse.com/process/query.php?search=${SEARCH_TERM}`,
  },
  composer: {
    color: 0xf28d1a,
    createTitle: (searchTerm: string) => `Packagist results for ${searchTerm}`,
    direct: `https://packagist.org/packages/${TERM}`,
    getExtendedInfoUrl: (pkg: string) =>
      `https://packagist.org/packages/${pkg}.json`,
    help: '!composer sentry',
    icon: 'https://packagist.org/bundles/packagistweb/img/logo-small.png',
    search: `https://packagist.org/search.json?q=${SEARCH_TERM}`,
  },
  github: {
    color: 0x24292e,
    createTitle: (searchTerm: string) => `GitHub results for *${searchTerm}*`,
    direct: `https://github.com/${TERM}`,
    help: '!github react',
    icon:
      'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    search: `https://api.github.com/search/repositories?q=${SEARCH_TERM}`,
  },
  mdn: {
    color: 0x83d0f2,
    createTitle: (searchTerm: string) => `MDN results for *${searchTerm}*`,
    direct: `https://developer.mozilla.org${TERM}`,
    help: '!mdn localStorage',
    icon: 'https://avatars0.githubusercontent.com/u/7565578',
    search: `https://developer.mozilla.org/api/v1/search?q=${SEARCH_TERM}&locale=en-US`,
  },
  npm: {
    color: 0xfb3e44,
    createTitle: (searchTerm: string) => `NPM results for *${searchTerm}*`,
    help: '!npm react',
    icon: 'https://avatars0.githubusercontent.com/u/6078720',
    search: `https://www.npmjs.com/search/suggestions?q=${SEARCH_TERM}`,
  },
  php: {
    color: 0x8892bf,
    createTitle: (searchTerm: string) => `PHP.net results for *${searchTerm}*`,
    direct: `https://www.php.net/${TERM}`,
    help: '!php echo',
    icon: 'https://www.php.net/images/logos/php-logo.svg',
    search: `https://www.php.net/${SEARCH_TERM}`,
  },
};

export const HELP_KEYWORD = '--help';
export const FORMATTING_KEYWORD = '!formatting';
export const FORMATTING_KEYWORD_ALT = '!format';
export const CODE_KEYWORD = '!code';
export const VSCODE_KEYWORD = '!vscode';
export const JOB_POSTING_KEYWORD = '!post';
export const JQUERY_KEYWORD = '!jquery';
export const POINTS_KEYWORD = '!points';
export const LEADERBOARD_KEYWORD = '!leaderboard';
export const DECAY_KEYWORD = '!decay';
export const MODULE_KEYWORD = '!modules';
export const LOCKFILE_KEYWORD = '!lockfile';
export const FLEXBOX_KEYWORD = '!flexbox';

/**
 * dynamic regExp matching all possible Object.keys(providers) as keyword
 */
export const KEYWORD_REGEXP = new RegExp(
  '^!(%PLACEHOLDER%)\\s+'.replace(
    '%PLACEHOLDER%',
    Object.keys(providers)
      .reduce((carry, keyword) => [...carry, keyword], [])
      .join('|')
  ),
  'i'
);

export const getSearchUrl = (provider: Provider, search: string) => {
  if (providers[provider]) {
    return providers[provider].search.replace(SEARCH_TERM, encodeURI(search));
  }

  throw new Error(`provider not implemeted: ${provider}`);
};

export const buildDirectUrl = (provider: Provider, href: string) => {
  if (providers[provider]) {
    return providers[provider].direct.replace(TERM, href);
  }

  throw new Error(`provider not implemeted: ${provider}`);
};

export const getExtendedInfoUrl = (provider: Provider, term: string) => {
  if (providers[provider] && providers[provider].getExtendedInfoUrl) {
    return providers[provider].getExtendedInfoUrl(term);
  }

  throw new Error(
    `provider or provider.getExtendedInfoUrl not implemented at provider: ${provider}`
  );
};

interface GetDataParams {
  msg: Message;
  provider: Provider;
  searchTerm: string;
  sanitizeData?: (data: any) => Partial<any>;
  isInvalidData: (data: any) => boolean;
  headers?: HeadersInit;
}

export const getData = async <T>({
  msg,
  provider,
  searchTerm,
  sanitizeData,
  isInvalidData,
  headers,
}: GetDataParams): Promise<Partial<T>> => {
  const searchUrl = getSearchUrl(provider, searchTerm);
  const { error, json: data } = await useData<T>(searchUrl, 'json', headers);

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
