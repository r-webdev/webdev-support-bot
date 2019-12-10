module.exports = {
  invalidResponse:
    'sorry, your request could not be processed. Please try again at a later time.',
  noResults: search =>
    `sorry, could not find anything for \`${search}\`. Autodeleting this response in 30 seconds.`,
  unknownError:
    'sorry, something went wrong. If this issue persists, please file an issue at https://github.com/ljosberinn/discord-mdn-bot',
  missingRightsDeletion: 'insufficient permissions: unable to delete message',
};
