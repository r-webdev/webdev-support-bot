const Discord = require('discord.js');
const fetch = require('node-fetch');
const DOMParser = require('dom-parser');
const Entities = require('html-entities').Html5Entities;
const { KEYWORD, ERRORS } = require('./constants');

const client = new Discord.Client();
const entities = new Entities();

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
 * @param {Discord.Message} msg
 */
const handleMessage = async msg => {
  const content = msg.content.replace(/<@.?[0-9]*?>/g, '').replace(/\s+/g, ' ');

  if (!content.toLowerCase().startsWith(KEYWORD)) {
    return;
  }

  let search = content.substr(KEYWORD.length);

  // empty query or call for help
  if (search.length === 0 || search === 'help') {
    msg.reply(
      'Usage: `!mdn <search term, e.g. localStorage>` (optional: `--results=<number between 1 and 10>`)',
    );
    return;
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
      const sentMessage = await msg.reply(ERRORS.noResults(search));

      setTimeout(() => {
        sentMessage.delete();
      }, 1000 * 30);

      return;
    }

    const results = document.getElementsByClassName('result');

    let description = results.reduce((carry, result, index) => {
      const { title, url } = extractTitleAndUrlFromResult(result);

      carry += `${index + 1}. ${createMarkdownLink(title, url)}\n`;

      return carry;
    }, '');

    description += `
    :bulb: *react with a number to filter your result*
    :gear: *issues? feature requests? head over to ${createMarkdownLink(
      'github',
      'https://github.com/ljosberinn/discord-mdn-bot',
    )}*`;

    const sentMsg = await msg.channel.send({
      embed: {
        title: `MDN results for *${search}*`,
        color: 0x83d0f2, // MDN landing page color
        url: searchUrl,
        footer: {
          icon_url: 'https://avatars0.githubusercontent.com/u/7565578',
          text: meta.split('for')[0],
        },
        description,
      },
    });

    try {
      const collectedReactions = await sentMsg.awaitReactions(
        reactionFilterBuilder(msg.author.id),
        {
          max: 1,
          time: 60 * 1000,
          errors: ['time'],
        },
      );

      const emojiName = collectedReactions.first().emoji.name;

      if (validReactions.deletion.includes(emojiName)) {
        await sentMsg.delete();
        return;
      }

      const index = validReactions.indices.findIndex(
        emoji => emoji === emojiName,
      );
      const chosenResult = results[index];

      const { url } = extractTitleAndUrlFromResult(chosenResult);

      // overwrite previous embed
      sentMsg.edit(url, { embed: null });
    } catch (collected) {
      // nobody reacted, doesn't matter
    }
  } catch (error) {
    console.error(error);
    msg.reply(ERRORS.unknownError);
  }
};

const validReactions = {
  deletion: ['❌', '✖️'],
  indices: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
};

/**
 *
 * @param {any} result [document.parseFromString return type]
 */
const extractTitleAndUrlFromResult = result => {
  const titleElement = result.getElementsByClassName('result-title')[0];

  const title = entities.decode(titleElement.textContent);
  const url = buildDirectUrl(titleElement.getAttribute('href'));

  return {
    title,
    url,
  };
};

/**
 *
 * @param {string} initialMessageAuthorId
 */
const reactionFilterBuilder = initialMessageAuthorId => (reaction, user) =>
  user.id === initialMessageAuthorId &&
  Object.values(validReactions).reduce(
    (carry, emojiArray) =>
      carry === true ? carry : emojiArray.includes(reaction.emoji.name),
    false,
  );

/**
 *
 * @param {string} title
 * @param {string} url
 */
const createMarkdownLink = (title, url) =>
  `[${title}](${url.replace(/\)/g, '\\)')})`;

/**
 *
 * @param {string} search
 */
const getSearchUrl = search =>
  `https://developer.mozilla.org/en-US/search?q=${search}`;

/**
 *
 * @param {string} href
 */
const buildDirectUrl = href => `https://developer.mozilla.org${href}`;

client.on('message', handleMessage);

client.login('NDUwNTkxMTgzMDQ4MDE1ODc0.XeLe0w.a5es-Cd9Tzw-BEqUMrirp38XkhU');
//client.login(process.env.DISCORD_TOKEN);
