const { getSearchUrl, buildDirectUrl } = require('../../utils/urlTools');
//eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
const Entities = require('html-entities').Html5Entities;
const DOMParser = require('dom-parser');
const errors = require('../../utils/errors');
const {
  createMarkdownLink,
  createDescription,
  delayedAutoDeleteMessage,
  createListEmbed,
  createMarkdownListItem,
  getChosenResult,
} = require('../../utils/discordTools');
const useData = require('../../utils/useData');

const entities = new Entities();

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleMDNQuery = async (msg, searchTerm) => {
  try {
    const searchUrl = getSearchUrl('mdn', searchTerm);
    const { error, text } = await useData(searchUrl, 'text');

    if (error) {
      msg.reply(errors.invalidResponse);
      return;
    }

    const parser = new DOMParser();
    const document = parser.parseFromString(text);

    // meta provides information about the amount of results found
    const meta = document.getElementsByClassName('result-meta')[0].textContent;
    if (meta.startsWith('0 documents found')) {
      const sentMsg = await msg.reply(errors.noResults(searchTerm));

      delayedAutoDeleteMessage(sentMsg);
      return;
    }

    const results = document.getElementsByClassName('result');

    const sentMsg = await msg.channel.send(
      createListEmbed({
        provider: 'mdn',
        searchTerm,
        url: searchUrl,
        footerText: meta.split('for')[0],
        description: createDescription(
          results.map((result, index) => {
            const { title, url } = extractTitleAndUrlFromResult(result);

            return createMarkdownListItem(
              index,
              createMarkdownLink(title, url),
            );
          }),
        ),
      }),
    );

    try {
      const chosenResult = await getChosenResult(sentMsg, msg, results);

      const { url } = extractTitleAndUrlFromResult(chosenResult);

      // overwrite previous embed
      await sentMsg.edit(url, { embed: null });
    } catch (collected) {
      // nobody reacted, doesn't matter
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
