const KEYWORD = '!mdn ';

const ERRORS = {
  invalidResponse:
    'sorry, your request could not be processed. Please try again at a later time.',
  noResults: search =>
    `sorry, could not find any documents for \`${search}\`. Autodeleting this response in 60 seconds.`,
  unknownError:
    'sorry, something went wrong. If this issue persists, please file an issue at https://github.com/ljosberinn/discord-mdn-bot',
};

module.exports = {
  KEYWORD,
  ERRORS,
};
