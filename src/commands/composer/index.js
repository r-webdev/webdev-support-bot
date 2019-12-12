const {
  getSearchUrl,
  HELP_KEYWORD,
  getExtendedInfoUrl,
  buildDirectUrl,
} = require('../../utils/urlTools');
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
  createMarkdownListItem,
  createDescription,
  adjustDescriptionLength,
  delayedAutoDeleteMessage,
} = require('../../utils/discordTools');
const useData = require('../../utils/useData');
const compareVersions = require('compare-versions');
const { formatDistanceToNow } = require('date-fns');
const help = require('../../utils/help');

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleComposerQuery = async (msg, searchTerm) => {
  // empty query or call for help
  if (searchTerm.length === 0 || searchTerm === HELP_KEYWORD) {
    await msg.reply(help.composer);
    return;
  }

  try {
    const searchUrl = getSearchUrl('composer', searchTerm);
    const { error, json } = await useData(searchUrl);

    if (error) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    if (json.results.length === 0) {
      const sentMessage = await msg.reply(errors.noResults(searchTerm));

      delayedAutoDeleteMessage(sentMessage);
      return;
    }

    const { total } = json;

    const firstTenResults = json.results
      .splice(0, 10)
      .map(({ name, description, repository, url, downloads, favers }) => ({
        name,
        description,
        url,
        repository,
        downloads,
        stars: favers,
      }));

    const embed = createListEmbed({
      provider: 'composer',
      searchTerm,
      url: `https://packagist.org/?query=${encodeURI(searchTerm)}`,
      footerText: `${total} packages found`,
      description: createDescription(
        firstTenResults.map(({ name, description, url }, index) => {
          const truncatedDescription =
            description.length > 0
              ? adjustDescriptionLength(index + 1, name, description)
              : '';

          const linkTitle =
            truncatedDescription.length > 0
              ? `**${name}** - *${truncatedDescription}*`
              : `**${name}**`;

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
        delayedAutoDeleteMessage(sentMsg, 1);
        return;
      }

      const index = validReactions.indices.findIndex(
        emoji => emoji === emojiName,
      );
      const chosenResult = firstTenResults[index];

      const extendedInfoUrl = getExtendedInfoUrl('composer', chosenResult.name);

      const { error, json } = await useData(extendedInfoUrl);

      if (error) {
        await msg.reply(errors.invalidResponse);
        return;
      }

      const {
        package: { name, downloads, description, maintainers, versions },
      } = json;

      const { version, released } = findLatestRelease(versions);

      const newEmbed = createEmbed({
        provider: 'composer',
        title: `${name} *(${version})*`,
        footerText: generateDetailedFooter(downloads, released),
        description,
        author: {
          icon_url: maintainers[0].avatar_url,
          name: maintainers[0].name,
        },
        url: buildDirectUrl('composer', name),
        fields: extractFieldsFromLatestRelease(versions[version]),
      });

      await sentMsg.edit(newEmbed);
    } catch (collected) {
      // nobody reacted, doesn't matter
    }
  } catch (error) {
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

const EMPTY_FIELD = {
  name: '\u200B',
  value: '\u200B',
};

/**
 *
 * @param {object} package.version response from packagist API
 */
const findLatestRelease = versions => {
  const { version, time } = Object.values(versions).reduce(
    (latest, item) => {
      const { version_normalized: itemVersion } = item;

      if (
        // ignore custom branch names as far as possible
        itemVersion.includes('.') &&
        !itemVersion.includes('/') &&
        !itemVersion.includes('-') &&
        compareVersions(latest.version_normalized, itemVersion) === -1
      ) {
        return item;
      }

      return latest;
    },
    { version_normalized: '0.0.0.0' },
  );

  return {
    version: version,
    released: formatDistanceToNow(new Date(time)),
  };
};

/**
 *
 * @param {object} latestRelease
 */
const extractFieldsFromLatestRelease = ({
  name,
  keywords,
  require,
  license,
  homepage,
  source,
  authors,
}) => {
  const fields = [
    {
      name: 'add to your project',
      value: `*composer require ${name}*`,
    },
  ];

  if (keywords.length > 0) {
    fields.push({
      name: 'Keywords',
      value: keywords
        .map(keyword => createMarkdownLink(keyword, createTagLink(keyword)))
        .join(', '),
    });
  }

  const phpRequirement = Object.entries(require).find(
    ([dependency]) => dependency === 'php',
  );

  if (phpRequirement) {
    fields.push({
      name: 'PHP version',
      value: phpRequirement[1],
      inline: true,
    });
  }

  fields.push({
    name: 'Dependencies',
    value: Object.keys(require).length - (phpRequirement ? 1 : 0),
    inline: true,
  });

  if (license) {
    fields.push({
      name: 'License',
      value: license.join(' '),
      inline: true,
    });
  }

  const lengthAfterSetup = fields.length;

  if (lengthAfterSetup > 0) {
    fields.push(EMPTY_FIELD);
  }

  let addedLinks = 0;

  if (homepage) {
    const { protocol } = new URL(homepage);

    fields.push({
      name: 'Homepage',
      value: createMarkdownLink(
        homepage.replace(`${protocol}//`, ''),
        homepage,
      ),
      inline: true,
    });

    addedLinks++;
  }

  if (source) {
    if (source.url.endsWith('.git')) {
      const { pathname } = new URL(source.url);

      fields.push({
        name: 'Repository',
        value: createMarkdownLink(
          pathname.substr(1).replace('.git', ''),
          source.url.replace('.git', ''),
        ),
        inline: true,
      });

      addedLinks++;
    }

    // possible todo: other repository providers
    // couldnt find one during development
  }

  const emptyFieldRequired = !(addedLinks === 2 && authors.length === 1);

  if (emptyFieldRequired) {
    fields.push(EMPTY_FIELD);
  }

  authors.forEach(author => {
    fields.push({
      name: 'Author',
      value: author.name,
      inline: true,
    });
  });

  return fields;
};

/**
 *
 * @param {string} tag
 */
const createTagLink = tag => `https://packagist.org/search/?tags=${tag}`;

/**
 *
 * @param {object} package.downloads
 * @param {number} released
 */
const generateDetailedFooter = (downloads, released) =>
  `Downloads: ${Object.entries(downloads)
    .reverse()
    .map(([period, amount]) => `${amount.toLocaleString()} ${period}`)
    .join(' | ')}\nlast updated ${released} ago`;

module.exports = handleComposerQuery;
