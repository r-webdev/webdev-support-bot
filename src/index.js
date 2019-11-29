const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const DOMParser = require('dom-parser');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const keyword = '!mdn ';

const ERRORS = {
  invalidResponse:
    'Sorry, your request could not be processed. Please try again at a later time.',
  noResults: search => `Sorry, could not find any documents for \`${search}\`.`,
  unknownError:
    'Sorry, something went wrong. If this issue persists, please file an issue at https://github.com/ljosberinn/discord-mdn-bot',
};

const RESPONSES = {
  usage: 'Usage: `!mdn <search term, e.g. localStorage>`',
  result: url => `I found this: ${url}`,
};

client.on('message', async msg => {
  if (!msg.content.startsWith(keyword)) {
    return;
  }

  const search = msg.content.substr(keyword.length).trim();

  if (search === '<@!281576651526111232>') {
    msg.reply('Change your name back ffs.');
    return;
  }

  if (search.length === 0 || search === 'help') {
    msg.reply(RESPONSES.usage);
    return;
  }

  try {
    const response = await fetch(getSearchUrl(search));

    if (!response.ok) {
      msg.reply(ERRORS.invalidResponse);
      return;
    }

    const text = await response.text();

    const parser = new DOMParser();
    const document = parser.parseFromString(text);

    // meta gives information about the amount of results found
    if (
      document
        .getElementsByClassName('result-meta')[0]
        .textContent.startsWith('0 documents found')
    ) {
      msg.reply(ERRORS.noResults(search));
      return;
    }

    const result = document.getElementsByClassName('result')[0];

    const title = result.getElementsByClassName('result-title')[0];
    const url = buildDirectUrl(title.getAttribute('href'));

    msg.reply(RESPONSES.result(url));
  } catch (error) {
    console.error(error);
    msg.reply(ERRORS.unknownError);
  }
});

client.login(process.env.DISCORD_TOKEN);

function getSearchUrl(search) {
  return `https://developer.mozilla.org/en-US/search?q=${search}`;
}

function buildDirectUrl(href) {
  return `https://developer.mozilla.org${href}`;
}
