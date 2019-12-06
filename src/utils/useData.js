const fetch = require('node-fetch');

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
