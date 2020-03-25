require('dotenv').config();
const { Client } = require('discord.js');
const { providers, KEYWORD_REGEXP, HELP_KEYWORD } = require('./utils/urlTools');

const errors = require('./utils/errors');

// commands begin here
const handleMDNQuery = require('./commands/mdn');
const handleNPMQuery = require('./commands/npm');
const handleComposerQuery = require('./commands/composer');
const handleCanIUseQuery = require('./commands/caniuse');
const handleGithubQuery = require('./commands/github');
const handleBundlephobiaQuery = require('./commands/bundlephobia');

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

const help = Object.entries(providers).reduce((carry, [provider, { help }]) => {
  carry[provider] = help;
  return carry;
}, {});

/**
 *
 * @param {import('discord.js').Message} msg
 */
const handleMessage = async msg => {
  const cleanContent = msg.cleanContent
    .replace(linebreakPattern, ' ')
    .toLowerCase();

  const isGeneralHelpRequest =
    cleanContent.includes(HELP_KEYWORD) &&
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
        return await handleMDNQuery(msg, searchTerm);
      case keywords.caniuse:
        return await handleCanIUseQuery(msg, searchTerm);
      case keywords.npm:
        return await handleNPMQuery(msg, searchTerm);
      case keywords.composer:
        return await handleComposerQuery(msg, searchTerm);
      case keywords.github:
        return await handleGithubQuery(msg, searchTerm);
      case keywords.bundlephobia:
        return await handleBundlephobiaQuery(msg, searchTerm);
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
