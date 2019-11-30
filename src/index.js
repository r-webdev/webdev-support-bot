const Discord = require('discord.js');
const fetch = require('node-fetch');
const DOMParser = require('dom-parser');
const Entities = require('html-entities').Html5Entities;
const constants = require('./constants');

const client = new Discord.Client();

const { KEYWORDS, RESPONSES, ERRORS, RESULT_AMOUNT_THRESHOLDS } = constants;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const handleMessage = async msg => {
  if (!msg.content.startsWith(KEYWORDS.initial)) {
    return;
  }

  let search = msg.content.substr(KEYWORDS.initial.length);

  // empty query (although Discord trims messages by default)
  // or call for help
  if (search.length === 0 || search === 'help') {
    msg.reply(RESPONSES.usage);
    return;
  }

  let amountOfResultsToShow = RESULT_AMOUNT_THRESHOLDS.default;

  // a hint will only be shown if the bot wasn't already called with it
  const withResultArgumentHint =
    search.indexOf(KEYWORDS.resultsArgument) === -1;

  // called with --result argument
  if (!withResultArgumentHint) {
    const parts = search.split(KEYWORDS.resultsArgument);

    search = parts[0];
    amountOfResultsToShow = parseResultAmount(parts[1]);
  }

  try {
    const searchUrl = getSearchUrl(encodeURI(search));
    const response = await fetch(searchUrl);

    if (!response.ok) {
      msg.reply(ERRORS.invalidResponse);
      return;
    }

    const text = await response.text();

    const parser = new DOMParser();
    const document = parser.parseFromString(text);

    // meta provides information about the amount of results found
    const meta = document.getElementsByClassName('result-meta')[0].textContent;
    if (meta.startsWith('0 documents found')) {
      msg.reply(ERRORS.noResults(search));
      return;
    }

    const results = document
      .getElementsByClassName('result')
      .slice(0, amountOfResultsToShow);

    // respond directly to the user
    if (amountOfResultsToShow === 1) {
      const title = results[0].getElementsByClassName('result-title')[0];
      const url = buildDirectUrl(title.getAttribute('href'));

      msg.reply(RESPONSES.result(url));
      return;
    }

    const entities = new Entities();

    let description = results.reduce((carry, result, index) => {
      const titleElement = result.getElementsByClassName('result-title')[0];

      const title = entities.decode(titleElement.textContent);
      const url = buildDirectUrl(titleElement.getAttribute('href'));

      carry += `${index + 1}. ${createMarkdownLink(title, url)}\n`;

      return carry;
    }, '');

    if (withResultArgumentHint) {
      description +=
        '\n *Hint: you can show up to 10 results by appending `--results=<number>` to your request!*';
    }

    msg.channel.send({
      embed: {
        title: `MDN results for *${search}*`,
        color: 0x83d0f2, // MDN landing page color
        url: searchUrl,
        footer: {
          icon_url: 'https://avatars0.githubusercontent.com/u/7565578',
          text: createFooter(meta.split('for')[0], amountOfResultsToShow),
        },
        description,
      },
    });
  } catch (error) {
    console.error(error);
    msg.reply(ERRORS.unknownError);
  }
};

const createMarkdownLink = (title, url) => {
  if (url.endsWith(')')) {
    url = url.substr(0, url.length - 1) + '%29';
  }

  return `[${title}](${url})`;
};

const getSearchUrl = search =>
  `https://developer.mozilla.org/en-US/search?q=${search}`;

const buildDirectUrl = href => `https://developer.mozilla.org${href}`;

const createFooter = (metaText, amountOfResultsToShow) =>
  `${metaText} - showing ${amountOfResultsToShow} of 10 first-page results`;

const parseResultAmount = givenValue => {
  const argument = Number(givenValue);

  if (Number.isNaN(argument)) {
    return RESULT_AMOUNT_THRESHOLDS.default;
  }

  if (argument > RESULT_AMOUNT_THRESHOLDS.max) {
    return RESULT_AMOUNT_THRESHOLDS.max;
  }

  if (argument < RESULT_AMOUNT_THRESHOLDS.min) {
    return RESULT_AMOUNT_THRESHOLDS.min;
  }

  return argument;
};

client.on('message', handleMessage);

client.login(process.env.DISCORD_TOKEN);
