const { getSearchUrl } = require('../../utils/urlTools');
//eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
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
  createEmbed,
} = require('../../utils/discordTools');
const BASE_DESCRIPTION = require('../shared');

const searchHeaders = {
  'X-SPIFERACK': 1,
};

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleNPMQuery = async (msg, searchTerm) => {
  // empty query or call for help
  if (searchTerm.length === 0 || searchTerm === '--help') {
    await msg.reply('Usage: `!npm <search term, e.g. react>`');
    return;
  }

  try {
    const searchUrl = getSearchUrl('npm', searchTerm);
    const response = await fetch(searchUrl, { headers: searchHeaders });

    if (!response.ok) {
      msg.reply(errors.invalidResponse);
      return;
    }

    const json = await response.json();

    if (json.objects.length === 0) {
      const sentMessage = await msg.reply(errors.noResults(searchTerm));

      setTimeout(() => {
        sentMessage.delete();
      }, 1000 * 30);

      return;
    }

    const { total, url } = json;

    const firstTenResults = json.objects.splice(0, 10).reduce(
      (carry, { package: { name, date, description, links } }, index) => [
        ...carry,
        {
          lastUpdate: date.rel,
          name,
          description: adjustDescriptionLength(index + 1, name, description),
          urls: {
            homepage: links.homepage,
            npm: links.npm,
            repository: links.repository,
          },
        },
      ],
      [],
    );

    const description =
      firstTenResults.reduce((carry, { name, description, urls }, index) => {
        const strongName = `**${name}**`;
        const hasMarkdownInDescription = description.indexOf('[!') > -1;

        const link = createMarkdownLink(
          hasMarkdownInDescription
            ? strongName
            : `${strongName} - *${description}*`,
          urls.npm,
        );

        carry += `${index + 1}. ${link}\n`;

        return carry;
      }, '') + BASE_DESCRIPTION;

    try {
      const embed = createListEmbed({
        provider: 'npm',
        url: `https://npmjs.com${url}`,
        footerText: `${total.toLocaleString()} packages found`,
        description,
        searchTerm,
      });

      const sentMsg = await msg.channel.send(embed);

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
        const chosenResult = firstTenResults[index];

        const fields = Object.entries(chosenResult.urls).map(([host, url]) => {
          const markdownTitle =
            host === 'homepage'
              ? url.replace('https://', '')
              : host === 'npm'
              ? url.split('/').pop()
              : url.indexOf('gitlab') > -1
              ? url.replace('https://gitlab.com/', '')
              : url.indexOf('github') > -1
              ? url.replace('https://github.com/', '')
              : url.indexOf('bitbucket') > -1
              ? url.replace('https://bitbucket.org/', '')
              : url;

          return {
            name: host,
            value: createMarkdownLink(
              markdownTitle.endsWith('/')
                ? markdownTitle.substr(0, markdownTitle.length - 1)
                : markdownTitle,
              url,
            ),
            inline: host !== 'homepage',
          };
        });

        const newEmbed = createEmbed({
          provider: 'npm',
          title: chosenResult.name,
          url: chosenResult.urls.npm,
          footerText: '',
          description: 'adf',
          fields,
        });

        console.log({ chosenResult, footer: newEmbed.embed.footer });

        // overwrite previous embed
        await sentMsg.edit(newEmbed);
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

const DESCRIPTION_LENGTH_LIMIT = 72;
const SEPARATOR_LENGTH = 3;

/**
 * Cuts off the description of a package name
 * based on the maximum of possible characters before
 * a linebreak occurs, keeping words intact.
 *
 * @param {number} position
 * @param {string} name
 * @param {string} description
 */
const adjustDescriptionLength = (position, name, description) => {
  const positionLength = position.toString().length + 2;
  const nameLength = name.length;
  const descriptionLength = description.length;

  const currentLength =
    positionLength + nameLength + SEPARATOR_LENGTH + descriptionLength;

  if (currentLength > DESCRIPTION_LENGTH_LIMIT) {
    const availableSpace =
      DESCRIPTION_LENGTH_LIMIT - positionLength - nameLength - SEPARATOR_LENGTH;

    let hasHitLimit = false;

    const shortenedDescription = description
      .split(' ')
      .reduce((carry, part) => {
        if (hasHitLimit || carry.length + part.length > availableSpace) {
          hasHitLimit = true;
          return carry;
        }

        if (carry.length === 0) {
          return part;
        }

        return [carry, part].join(' ');
      }, '');

    return shortenedDescription + '...';
  }

  return description;
};

module.exports = handleNPMQuery;
