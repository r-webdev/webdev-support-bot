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

    const firstTenResults = json.objects
      .splice(0, 10)
      .map(({ package: { name, date, description, links, publisher } }) => ({
        lastUpdate: date.rel,
        url: links.npm,
        externalUrls: {
          homepage: links.homepage,
          repository: links.repository,
        },
        author: {
          name: publisher.name,
          icon_url: publisher.avatars.small,
          url: `https://www.npmjs.com/~${publisher.name}`,
        },
        name,
        description,
      }));

    try {
      const embed = createListEmbed({
        provider: 'npm',
        url: `https://npmjs.com${url}`,
        footerText: `${total.toLocaleString()} packages found`,
        searchTerm,
        description:
          firstTenResults.reduce((carry, { name, description, url }, index) => {
            // cant guarantee syntactically correct markdown image links,
            // hence ignore description in those cases
            // e.g. redux-react-session
            const hasMarkdownImageLink = description.indexOf('[!') > -1;

            const linkTitle = hasMarkdownImageLink
              ? `**${name}**`
              : `**${name}** - *${adjustDescriptionLength(
                  index + 1,
                  name,
                  description,
                )}*`;

            const link = createMarkdownLink(linkTitle, url);

            return carry + `${index + 1}. ${link}\n`;
          }, '') + BASE_DESCRIPTION,
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

        // create fields for all links except npm since that ones in the title already
        const fields = Object.entries(chosenResult.externalUrls).map(
          ([host, url]) => {
            const markdownTitle = sanitizePackageLink(host, url);

            return {
              name: host,
              value: createMarkdownLink(
                markdownTitle.endsWith('/')
                  ? markdownTitle.substr(0, markdownTitle.length - 1)
                  : markdownTitle,
                url,
              ),
              inline: true,
            };
          },
        );

        const newEmbed = createEmbed({
          provider: 'npm',
          title: chosenResult.name,
          url: chosenResult.url,
          footerText: `last updated ${chosenResult.lastUpdate}`,
          description: chosenResult.description,
          author: chosenResult.author,
          fields,
        });

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

const sanitizePackageLink = (host, link) => {
  const { protocol, pathname } = new URL(link);

  if (host === 'homepage') {
    return link.replace(`${protocol}//`, '');
  }

  if (host === 'repository') {
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  }

  return link;
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
