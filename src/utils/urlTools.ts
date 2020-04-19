import { noResults, invalidResponse } from './errors';
import useData from './useData';
import delayedMessageAutoDeletion from './delayedMessageAutoDeletion';
import { Provider } from './discordTools';
import { Message } from 'discord.js';
import { HeadersInit } from 'node-fetch';

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
  mdn: {
    search: `https://developer.mozilla.org/en-US/search?q=${SEARCH_TERM}`,
    direct: `https://developer.mozilla.org${TERM}`,
    color: 0x83d0f2,
    createTitle: (searchTerm: string) => `MDN results for *${searchTerm}*`,
    icon: 'https://avatars0.githubusercontent.com/u/7565578',
    help: '!mdn localStorage',
  },
  npm: {
    search: `https://www.npmjs.com/search/suggestions?q=${SEARCH_TERM}`,
    color: 0xfb3e44,
    createTitle: (searchTerm: string) => `NPM results for *${searchTerm}*`,
    icon: 'https://avatars0.githubusercontent.com/u/6078720',
    help: '!npm react',
  },
  composer: {
    search: `https://packagist.org/search.json?q=${SEARCH_TERM}`,
    direct: `https://packagist.org/packages/${TERM}`,
    color: 0xf28d1a,
    createTitle: (searchTerm: string) => `Packagist results for ${searchTerm}`,
    icon: 'https://packagist.org/bundles/packagistweb/img/logo-small.png',
    getExtendedInfoUrl: (pkg: string) =>
      `https://packagist.org/packages/${pkg}.json`,
    help: '!composer sentry',
  },
  caniuse: {
    search: `https://caniuse.com/process/query.php?search=${SEARCH_TERM}`,
    direct: `https://caniuse.com/#feat=${TERM}`,
    color: 0xdb5600,
    createTitle: (searchTerm: string) => `CanIUse results for *${searchTerm}*`,
    icon: 'https://caniuse.com/img/favicon-128.png',
    getExtendedInfoUrl: (text: string) =>
      `https://caniuse.com/process/get_feat_data.php?type=support-data&feat=${text}`,
    help: '!caniuse IntersectionObserver',
  },
  github: {
    search: `https://api.github.com/search/repositories?q=${SEARCH_TERM}`,
    direct: `https://github.com/${TERM}`,
    color: 0x24292e,
    createTitle: (searchTerm: string) => `GitHub results for *${searchTerm}*`,
    icon:
      'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    help: '!github react',
  },
  bundlephobia: {
    search: `https://api.npms.io/v2/search/suggestions?q=${SEARCH_TERM}`,
    direct: `https://bundlephobia.com/result?p=${TERM}`,
    color: 0xffffff,
    createTitle: (searchTerm: string) =>
      `Bundlephobia results for *${searchTerm}*`,
    getExtendedInfoUrl: (pkg: string) =>
      `https://bundlephobia.com/api/size?package=${pkg}&record=true`,
    icon: 'https://bundlephobia.com/android-chrome-192x192.png',
    help: '!bundlephobia @chakra-ui/core',
  },
};

export const HELP_KEYWORD = '--help';
export const FORMATTING_KEYWORD = '!formatting';
export const CODE_KEYWORD = '!code';
export const VSCODE_KEYWORD = '!vscode';

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
