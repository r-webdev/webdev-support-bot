import fetch, { HeaderInit } from 'node-fetch';

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

export default async <T>(
  url: string,
  type: 'json' | 'text' = 'json',
  headers: HeaderInit = {}
): Promise<UnknownData<T>> => {
  const response = await fetch(url, { headers });

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
      text: null,
      json,
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
