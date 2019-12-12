require('dotenv').config();
// eslint-disable-next-line no-unused-vars
const { Client, Message } = require('discord.js');
const { providers, KEYWORD_REGEXP, HELP_KEYWORD } = require('./utils/urlTools');

const help = require('./utils/help');
const errors = require('./utils/errors');

// commands begin here
const handleMDNQuery = require('./commands/mdn');
const handleNPMQuery = require('./commands/npm');
const handleComposerQuery = require('./commands/composer');
const handleCanIUseQuery = require('./commands/caniuse');
const handleGithubQuery = require('./commands/github');

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.once('ready', async () => {
  client.user.setActivity(`@${client.user.username} --help`);

  try {
    await client.user.setAvatar('./logo.png');
  } catch (error) {}
});

// { mdn: 'mdn', /* etc */ }
const keywords = Object.keys(providers).reduce((carry, keyword) => {
  carry[keyword] = keyword;
  return carry;
}, {});

const trimCleanContent = (provider, cleanContent) =>
  cleanContent.substr(keywords[provider].length + 2);

const linebreakPattern = /\n/gim;

/**
 *
 * @param {Message} msg
 */
const handleMessage = async msg => {
  const cleanContent = msg.cleanContent
    .replace(linebreakPattern, ' ')
    .toLowerCase();

  const isGeneralHelpRequest =
    cleanContent.includes('--help') &&
    msg.mentions.users.find(
      ({ username }) => username === client.user.username,
    );

  const isCommandQuery =
    cleanContent.startsWith('!') && KEYWORD_REGEXP.test(cleanContent);

  if (isGeneralHelpRequest) {
    const prefix = 'try one of these:\n';

    await msg.reply(prefix + Object.values(help).join('\n'));
    return;
  }

  // bail if no keyword was found
  if (!isCommandQuery) {
    return;
  }

  const keyword = cleanContent.split(' ', 1)[0].substr(1);
  const searchTerm = trimCleanContent(keywords[keyword], cleanContent);

  const isSpecificHelpRequest =
    searchTerm.length === 0 || searchTerm === HELP_KEYWORD;

  // empty query or specific call for help
  if (isSpecificHelpRequest) {
    await msg.reply(help[keyword]);
    return;
  }

  try {
    switch (keyword) {
      case keywords.mdn:
        await handleMDNQuery(msg, searchTerm);
        return;
      case keywords.caniuse:
        await handleCanIUseQuery(msg, searchTerm);
        return;
      case keywords.npm:
        await handleNPMQuery(msg, searchTerm);
        return;
      case keywords.composer:
        await handleComposerQuery(msg, searchTerm);
        return;
      case keywords.github:
        await handleGithubQuery(msg, searchTerm);
        return;
      default:
        throw new Error('classic "shouldnt be here" scenario');
    }
  } catch (error) {
    console.error(`${error.name}: ${error.message}`);
    await msg.reply(errors.unknownError);
  }
};

client.on('message', handleMessage);

try {
  client.login(
    process.env.NODE_ENV !== 'production'
      ? process.env.DUMMY_TOKEN
      : process.env.DISCORD_TOKEN,
  );
} catch (error) {
  console.error('Boot Error: token invalid');
}
