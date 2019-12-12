const { getData } = require('../../utils/urlTools');
//eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
const errors = require('../../utils/errors');
const {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  adjustDescriptionLength,
  createDescription,
  createMarkdownListItem,
  getChosenResult,
  createMarkdownBash,
} = require('../../utils/discordTools');
const { formatDistanceToNow } = require('date-fns');

const provider = 'npm';

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleNPMQuery = async (msg, searchTerm) => {
  try {
    const json = await getData({
      msg,
      searchTerm,
      provider,
      isInvalidData: json => json.length === 0,
    });

    if (!json) {
      return;
    }

    const firstTenResults = json
      .splice(0, 10)
      .map(({ name, date, description, links, publisher, maintainers }) => ({
        lastUpdate: `${formatDistanceToNow(new Date(date))} ago`,
        url: links.npm,
        externalUrls: {
          homepage: links.homepage,
          repository: links.repository,
        },
        author: {
          name: publisher.username,
          //icon_url: publisher.avatars.small,
          url: `https://www.npmjs.com/~${publisher.username}`,
        },
        name,
        description,
        maintainers: maintainers.length,
      }));

    if (firstTenResults.length === 1) {
      const embed = createEmbed(createNPMEmbed(firstTenResults[0]));

      await msg.channel.send(embed);
      return;
    }

    const embed = createListEmbed({
      provider,
      url: `https://npmjs.com/search?q=${searchTerm}`,
      footerText: `at least ${firstTenResults.length.toLocaleString()} packages found`,
      searchTerm,
      description: createDescription(
        firstTenResults.map(({ name, description, url }, index) => {
          // cant guarantee syntactically correct markdown image links due to
          // npm limiting description to 255 chars,
          // hence ignore description in those cases
          // e.g. redux-react-session
          const hasMarkdownImageLink = description
            ? description.includes('[!')
            : true;

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
      const result = await getChosenResult(sentMsg, msg, firstTenResults);

      // overwrite previous embed
      await sentMsg.edit(createEmbed(createNPMEmbed(result)));
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
 * @param {{
 *  externalUrls: { homepage: string, repository: string},
 *  name: string,
 *  url: string,
 *  description: string,
 *  lastUpdate: string,
 *  maintainers: number,
 *  author: {name: string, url: string}
 *  }}
 */
const createNPMEmbed = ({
  externalUrls,
  name,
  url,
  description,
  lastUpdate,
  maintainers,
  author,
}) => ({
  provider,
  title: name,
  url: url,
  footerText: `last updated ${lastUpdate}`,
  description: description,
  author: author,
  fields: createFields(name, externalUrls, maintainers),
});

/**
 *  Creates fields for all links except npm since that ones in the title already
 *
 * @param {{homepage: string, repository: string}} externalUrls
 */
const createFields = (name, externalUrls, maintainers) => [
  {
    name: 'add to your project',
    value: createMarkdownBash(`npm install ${name}`),
  },
  ...Object.entries(externalUrls).map(([host, url]) => {
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
  }),
  {
    name: 'maintainers',
    value: maintainers,
    inline: true,
  },
];

/**
 *
 * @param {string} host
 * @param {string} link
 */
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
