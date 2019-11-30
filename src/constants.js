const KEYWORDS = {
  initial: '!mdn ',
  resultsArgument: ' --results=',
};

const RESULT_AMOUNT_THRESHOLDS = {
  default: 3,
  min: 1,
  max: 10,
};

const ERRORS = {
  invalidResponse:
    'Sorry, your request could not be processed. Please try again at a later time.',
  noResults: search => `Sorry, could not find any documents for \`${search}\`.`,
  unknownError:
    'Sorry, something went wrong. If this issue persists, please file an issue at https://github.com/ljosberinn/discord-mdn-bot',
};

const RESPONSES = {
  usage:
    'Usage: `!mdn <search term, e.g. localStorage>` (optional: `--results=<number between 1 and 10>`)',
};

module.exports = {
  KEYWORDS,
  ERRORS,
  RESPONSES,
  RESULT_AMOUNT_THRESHOLDS,
};
