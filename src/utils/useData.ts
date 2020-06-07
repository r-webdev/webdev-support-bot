import fetch, {
  HeaderInit,
  RequestInfo,
  RequestInit,
  Response,
} from 'node-fetch';
import * as NodeCache from 'node-cache';

import {
  API_CACHE_ENTRIES_LIMIT,
  API_CACHE_EXPIRATION_IN_SECONDS,
  API_CACHE_REVALIDATION_WINDOW_IN_SECONDS,
} from '../env';

const apiCache = new NodeCache({
  checkperiod: parseInt(API_CACHE_REVALIDATION_WINDOW_IN_SECONDS, 10),
  stdTTL: parseInt(API_CACHE_EXPIRATION_IN_SECONDS, 10),
  maxKeys: parseInt(API_CACHE_ENTRIES_LIMIT, 10),
});

type ResponseTypes = 'json' | 'text';

type UnknownData<T> =
  | {
      error: true;
      json: null;
      text: null;
    }
  | {
      error: false;
      text: null;
      json: T;
    }
  | {
      error: false;
      json: null;
      text: string;
    };

type ResponseMapper<Data> = (response: Response) => Promise<Data>;
type FetchWithFormat<Format> = (
  url: RequestInfo,
  init?: RequestInit
) => Promise<Format>;

/**
 * Given a cache key and a function that maps the fetch response to a arbitrary
 * data structure, return a function when invoked, lower cases the cache key and
 * returns the cached formatted response when found.
 *
 * If the cache entry is _not_ found, delegate the call to an actual fetch implementation
 * to make the HTTP request. This response is then formatted with the function
 * above and saved into the cache. HTTP requests times/durations are also logged.
 */
const doFetch: <TParsedResponse>(
  cacheKey: string,
  mapper: ResponseMapper<TParsedResponse>
) => FetchWithFormat<TParsedResponse> = <TParsedResponse>(cacheKey, mapper) => {
  const casedCacheKey = cacheKey.toLowerCase();
  const cachedResponse = apiCache.get<TParsedResponse>(casedCacheKey);
  if (cachedResponse) {
    return async () => cachedResponse;
  }

  return async (url, fetchOptions) => {
    const timeLabel = `Time took for url=${encodeURIComponent(url.toString())}`;
    console.time(timeLabel);
    const response = await fetch(url, fetchOptions);
    console.timeEnd(timeLabel);
    const formattedResponse = await mapper(response);
    apiCache.set(casedCacheKey, formattedResponse);
    return formattedResponse;
  };
};

const responseMapper: <T>(
  type: ResponseTypes
) => (response: Response) => Promise<UnknownData<T>> = (
  type: string
) => async response => {
  if (!response.ok) {
    return {
      error: true,
      json: null,
      text: null,
    };
  }

  if (type === 'json') {
    const json = await response.json();
    return {
      error: false,
      json,
      text: null,
    };
  }

  if (type === 'text') {
    const text = await response.text();

    return {
      error: false,
      json: null,
      text,
    };
  }
};

export default async <T>(
  url: string,
  type: ResponseTypes = 'json',
  headers: HeaderInit = {}
): Promise<UnknownData<T>> => {
  return doFetch(url, responseMapper<T>(type))(url, { headers });
};
