require('dotenv').config();
// eslint-disable-next-line no-unused-vars
const { Client, Message } = require('discord.js');
const { providers, KEYWORD_REGEXP } = require('./utils/urlTools');

const handleMDNQuery = require('./commands/mdn');

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.once('ready', () => {
  client.user.setActivity('you code...', {
    type: 'WATCHING',
  });
});

/**
 *
 * @param {Message} msg
 */
const handleMessage = async msg => {
  const { cleanContent } = msg;

  // bail if no keyword was found
  if (!cleanContent.startsWith('!') || !KEYWORD_REGEXP.test(cleanContent)) {
    return;
  }

  const keywords = Object.keys(providers).reduce((carry, keyword) => {
    carry[keyword] = keyword;
    return carry;
  }, {});

  switch (cleanContent.split(' ', 1)[0].substr(1)) {
    case keywords.mdn:
      await handleMDNQuery(msg, cleanContent.substr(keywords.mdn.length + 1));
      return;
    case keywords.caniuse:
      return;
    case keywords.npm:
      return;
    case keywords.composer:
      return;
    default:
      throw new Error('classic "shouldnt be here" scenario');
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
  console.error('Invalid token.');
}
