const { getSearchUrl, buildDirectUrl } = require('../../utils/urlTools');
//eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
const Entities = require('html-entities').Html5Entities;
const DOMParser = require('dom-parser');
const {
  validReactions,
  reactionFilterBuilder,
  awaitReactionConfig,
} = require('../../utils/reactions');
const errors = require('../../utils/errors');
const fetch = require('node-fetch');
const {
  createMarkdownLink,
  createListEmbed,
} = require('../../utils/discordTools');
const BASE_DESCRIPTION = require('../shared');

const entities = new Entities();

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleMDNQuery = async (msg, searchTerm) => {
  // empty query or call for help
  if (searchTerm.length === 0 || searchTerm === 'help') {
    await msg.reply('Usage: `!mdn <search term, e.g. localStorage>`');
    return;
  }

  try {
    const searchUrl = getSearchUrl('mdn', searchTerm);
    const response = await fetch(searchUrl);

    if (!response.ok) {
      msg.reply(errors.invalidResponse);
      return;
    }

    const text = await response.text();

    const parser = new DOMParser();
    const document = parser.parseFromString(text);

    // meta provides information about the amount of results found
    const meta = document.getElementsByClassName('result-meta')[0].textContent;
    if (meta.startsWith('0 documents found')) {
      const sentMessage = await msg.reply(errors.noResults(searchTerm));

      setTimeout(() => {
        sentMessage.delete();
      }, 1000 * 30);

      return;
    }

    const results = document.getElementsByClassName('result');

    const description =
      results.reduce((carry, result, index) => {
        const { title, url } = extractTitleAndUrlFromResult(result);

        carry += `${index + 1}. ${createMarkdownLink(title, url)}\n`;

        return carry;
      }, '') + BASE_DESCRIPTION;

    try {
      const sentMsg = await msg.channel.send(
        createListEmbed({
          provider: 'mdn',
          searchTerm,
          url: searchUrl,
          footerText: meta.split('for')[0],
          description,
        }),
      );

      try {
        const collectedReactions = await sentMsg.awaitReactions(
          reactionFilterBuilder(msg.author.id),
          awaitReactionConfig,
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
        await sentMsg.edit(url, { embed: null });
      } catch (collected) {
        // nobody reacted, doesn't matter
      }
    } catch (error) {
      console.error(`${error.name}: ${error.message}`);
    }
  } catch (error) {
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

/**
 *
 * @param {any} result [document.parseFromString return type]
 */
const extractTitleAndUrlFromResult = result => {
  const titleElement = result.getElementsByClassName('result-title')[0];

  const title = entities.decode(titleElement.textContent);
  const url = buildDirectUrl('mdn', titleElement.getAttribute('href'));

  return {
    title,
    url,
  };
};

module.exports = handleMDNQuery;
