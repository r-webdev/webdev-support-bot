const KEYWORD = '!mdn ';

const ERRORS = {
  invalidResponse:
    'Sorry, your request could not be processed. Please try again at a later time.',
  noResults: search => `Sorry, could not find any documents for \`${search}\`.`,
  unknownError:
    'Sorry, something went wrong. If this issue persists, please file an issue at https://github.com/ljosberinn/discord-mdn-bot',
};

module.exports = {
  KEYWORD,
  ERRORS,
};
