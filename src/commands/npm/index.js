const { getSearchUrl, HELP_KEYWORD } = require('../../utils/urlTools');
//eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
const {
  validReactions,
  reactionFilterBuilder,
  awaitReactionConfig,
} = require('../../utils/reactions');
const errors = require('../../utils/errors');
const {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  delayedAutoDeleteMessage,
  adjustDescriptionLength,
  createDescription,
  createMarkdownListItem,
} = require('../../utils/discordTools');
const useData = require('../../utils/useData');

const headers = {
  'X-SPIFERACK': 1,
};

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleNPMQuery = async (msg, searchTerm) => {
  // empty query or call for help
  if (searchTerm.length === 0 || searchTerm === HELP_KEYWORD) {
    await msg.reply('Usage: `!npm react`');
    return;
  }

  try {
    const searchUrl = getSearchUrl('npm', searchTerm);
    const { error, json } = await useData(searchUrl, 'json', { headers });

    if (error) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    if (json.objects.length === 0) {
      const sentMsg = await msg.reply(errors.noResults(searchTerm));

      delayedAutoDeleteMessage(sentMsg);
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
        description: createDescription(
          firstTenResults.map(({ name, description, url }, index) => {
            // cant guarantee syntactically correct markdown image links due to
            // npm limiting description to 255 chars,
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

            return createMarkdownListItem(
              index,
              createMarkdownLink(linkTitle, url),
            );
          }),
        ),
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

module.exports = handleNPMQuery;
