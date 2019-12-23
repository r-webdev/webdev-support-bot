const { getExtendedInfoUrl, getData } = require('../../utils/urlTools');
const errors = require('../../utils/errors');
const {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  createDescription,
  createMarkdownListItem,
  getChosenResult,
  attemptEdit,
} = require('../../utils/discordTools');
const useData = require('../../utils/useData');
const bcd = require('mdn-browser-compat-data');
const emojis = require('../../utils/emojis');
const delayedMessageAutoDeletion = require('../../utils/delayedMessageAutoDeletion');

const provider = 'caniuse';

const browserNameMap = Object.entries(bcd.browsers).reduce(
  (carry, [id, { name }]) => {
    carry[id] = name;

    return carry;
  },
  {},
);

/**
 *
 * @param {import('discord.js').Message} msg
 * @param {string} searchTerm
 */
const handleCanIUseQuery = async (msg, searchTerm) => {
  try {
    const text = await getData({
      msg,
      searchTerm,
      provider,
      sanitizeData: text => text.replace('"', ''),
      isInvalidData: text => text.length === 0,
    });

    if (!text) {
      return;
    }

    const { error: extendedQueryError, json } = await useData(
      getExtendedInfoUrl(provider, text),
    );

    if (extendedQueryError) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    let hashes = text.split(',').splice(0, 10);

    // ignore pure web-standard information as it lacks a path to MDN
    const filteredResults = json.filter((dataset, index) => {
      const isValid = !!dataset.path;

      if (!isValid) {
        // remove hash reference to preserve same indices with json
        hashes[index] = undefined;
      }

      return isValid;
    });

    hashes = hashes.filter(Boolean);
    const resultAmount = filteredResults.length;

    if (resultAmount === 0) {
      const sentMsg = await msg.reply(errors.noResults(searchTerm));

      delayedMessageAutoDeletion(sentMsg);
      return;
    }

    const firstTenResults = filteredResults
      .splice(0, 10)
      .map(({ title, path }, index) => ({
        title,
        url: buildHashUrl(hashes[index]),
        compatibilityMap: extractCompatibilityFromBCD(path),
      }));

    const sentMsg = await msg.channel.send(
      createListEmbed({
        url: `https://caniuse.com/#search=${encodeURI(searchTerm)}`,
        footerText: `${resultAmount} results found`,
        provider,
        searchTerm,
        description: createDescription(
          firstTenResults.map(({ title, url }, index) =>
            createMarkdownListItem(index, createMarkdownLink(title, url)),
          ),
        ),
      }),
    );

    const result = await getChosenResult(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    const { title, url, compatibilityMap } = result;

    const fields = Object.entries(compatibilityMap.support).map(
      ([id, data]) => {
        const {
          isSupported,
          prefix,
          altName,
          flags: { isUserPreference, hasRuntimeFlag },
          isPartialImplementation,
        } = getFeatureMetadata(data);

        return {
          name: browserNameMap[id],
          inline: true,
          value: [
            isSupported,
            hasRuntimeFlag && `${emojis.warning} behind a flag`,
            isUserPreference && `${emojis.warning} user preference`,
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

    await attemptEdit(
      sentMsg,
      createEmbed({
        provider,
        url,
        title: `CanIUse... ${title}`,
        footerText:
          'This bot only considers the **latest stable version** of a browser.',
        description: createMarkdownLink(
          'visit MDN for more information about this specific API',
          compatibilityMap.mdn_url,
        ),
        fields,
      }),
    );
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

  const flagInformation = {
    isUserPreference: false,
    hasRuntimeFlag: false,
  };

  if (flags) {
    flagInformation.isUserPreference = !!flags.find(
      ({ type }) => type === 'preference',
    );

    flagInformation.hasRuntimeFlag = !!flags.find(
      ({ type }) => type === 'runtime_flag',
    );
  }

  // a feature may not be behind a flag to be supported in general
  const isSupported =
    version_added && !flagInformation.runtimeFlag ? emojis.yes : emojis.no;

  return {
    isSupported,
    flags: flagInformation,
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

  const compatObj = parts.reduce((carry, part) => {
    if (carry[part]) {
      return carry[part];
    }

    return bcd[part];
  }, {});

  if (compatObj[finalProp]) {
    return compatObj[finalProp].__compat;
  }

  if (finalProp.includes('-')) {
    const capitalizedProp = finalProp
      .split('-')
      .map(str => str.charAt(0).toUpperCase() + str.slice(1))
      .join('-');

    return compatObj[capitalizedProp].__compat;
  }

  throw new Error(`unknown path/finalProp: ${path} -> ${finalProp}`);
};

/**
 *
 * @param {string} hash
 */
const buildHashUrl = hash => `https://caniuse.com/#feat=${hash}`;

module.exports = handleCanIUseQuery;
