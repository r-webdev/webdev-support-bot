const {
  getSearchUrl,
  getExtendedInfoUrl,
  HELP_KEYWORD,
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
  createDescription,
  createMarkdownListItem,
  delayedAutoDeleteMessage,
} = require('../../utils/discordTools');
const useData = require('../../utils/useData');
const bcd = require('mdn-browser-compat-data');
const help = require('../../utils/help');

const emojis = {
  warning: ':exclamation:',
  yes: ':white_check_mark:',
  no: ':x:',
};

const browserNameMap = Object.entries(bcd.browsers).reduce(
  (carry, [id, { name }]) => {
    carry[id] = name;

    return carry;
  },
  {},
);

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleCanIUseQuery = async (msg, searchTerm) => {
  // empty query or call for help
  if (searchTerm.length === 0 || searchTerm === HELP_KEYWORD) {
    await msg.reply(help.caniuse);
    return;
  }

  try {
    const searchUrl = getSearchUrl('caniuse', searchTerm);
    const { error, json: text } = await useData(searchUrl);

    const sanitizedText = text.replace('"', '');

    if (error) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    // dont trust the honestly weird caniuse API
    if (sanitizedText.length === 0 || sanitizedText.indexOf(',') === -1) {
      await msg.reply(errors.noResults(searchTerm));

      delayedAutoDeleteMessage(msg);
      return;
    }

    const { error: extendedQueryError, json } = await useData(
      getExtendedInfoUrl('caniuse', sanitizedText),
    );

    // ignore pure web-standard information as it lacks a path to MDN
    const filteredResults = json.filter(dataset => !!dataset.path);

    const resultAmount = filteredResults.length;

    if (extendedQueryError) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    const hashes = sanitizedText.split(',').splice(0, 10);

    const firstTenResults = filteredResults
      .splice(0, 10)
      .map(({ title, path }, index) => ({
        title,
        url: buildHashUrl(hashes[index]),
        compatibilityMap: extractCompatibilityFromBCD(path),
      }));

    const embed = createListEmbed({
      provider: 'caniuse',
      url: `https://caniuse.com/#search=${encodeURI(searchTerm)}`,
      footerText: `${resultAmount} results found`,
      searchTerm,
      description: createDescription(
        firstTenResults.map(({ title, url }, index) =>
          createMarkdownListItem(index, createMarkdownLink(title, url)),
        ),
      ),
    });

    try {
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

        const { title, url, compatibilityMap } = firstTenResults[index];

        const fields = Object.entries(compatibilityMap.support).map(
          ([id, data]) => {
            const {
              isSupported,
              prefix,
              altName,
              hasFlag,
              isPartialImplementation,
            } = getFeatureMetadata(data);

            return {
              name: browserNameMap[id],
              inline: true,
              value: [
                isSupported,
                hasFlag && `${emojis.warning} behind a flag`,
                altName && `${emojis.warning} alt. name: ${altName}`,
                prefix && `${emojis.warning} use prefix: ${prefix}`,
                isPartialImplementation &&
                  `${emojis.warning} only partially supported`,
              ]
                .filter(Boolean)
                .join('\n'),
            };
          },
        );

        const embed = createEmbed({
          provider: 'caniuse',
          title: `CanIUse... ${title}`,
          url,
          footerText:
            'This bot only considers the **latest stable version** of a browser.',
          description: createMarkdownLink(
            'visit MDN for more information about this specific API',
            compatibilityMap.mdn_url,
          ),
          fields,
        });

        // overwrite previous embed
        await sentMsg.edit(embed);
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
 * @param {object|array} data
 *
 * @see https://github.com/mdn/browser-compat-data/blob/master/schemas/compat-data-schema.md#the-support_statement-object
 */
const getFeatureMetadata = data => {
  const {
    version_added,
    flags,
    alternative_name,
    prefix,
    partial_implementation,
  } = data.length ? data[0] : data;

  return {
    isSupported: version_added ? emojis.yes : emojis.no,
    hasFlag: !!flags,
    altName: alternative_name && alternative_name,
    prefix: prefix && prefix,
    isPartialImplementation: !!partial_implementation,
  };
};

/**
 * Accesses browser-compat-data at the required level
 * and returns the __compat property
 *
 * @see https://github.com/mdn/browser-compat-data/blob/master/schemas/compat-data-schema.md#the-__compat-object
 *
 * @param {string} path
 */
const extractCompatibilityFromBCD = path => {
  const parts = path.split('/');
  const finalProp = parts.pop().replace('.json', '');

  return parts.reduce((carry, part) => {
    if (carry[part]) {
      return carry[part];
    }

    return bcd[part];
  }, {})[finalProp].__compat;
};

/**
 *
 * @param {string} hash
 */
const buildHashUrl = hash => `https://caniuse.com/#feat=${hash}`;

module.exports = handleCanIUseQuery;
