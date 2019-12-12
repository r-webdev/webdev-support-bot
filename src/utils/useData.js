const fetch = require('node-fetch');

/**
 *
 * @param {string} url
 * @param {'json'|'text'} type
 * @param {object?} headers
 *
 * @returns {Promise<{
 *  error: true,
 *  json: null,
 *  text: null,
 * } | {
 *  error: false,
 *  text: null,
 *  json: object|array
 * } | {
 *  error: false,
 *  json: null,
 *  text: string
 *  }>
 * }
 */
const useData = async (url, type = 'json', headers = {}) => {
  const response = await fetch(url, headers);

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

module.exports = useData;
