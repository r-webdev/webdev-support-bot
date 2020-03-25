const {
  getExtendedInfoUrl,
  buildDirectUrl,
  getData,
} = require('../../utils/urlTools');
const errors = require('../../utils/errors');
const {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  createMarkdownListItem,
  createDescription,
  adjustDescriptionLength,
  getChosenResult,
  EMPTY_FIELD,
  attemptEdit,
} = require('../../utils/discordTools');
const useData = require('../../utils/useData');
const emojis = require('../../utils/emojis');
const compareVersions = require('compare-versions');

const provider = 'bundlephobia';

/**
 *
 * @param {import('discord.js').Message} msg
 * @param {string} searchTerm
 */
const handleBundlephobiaQuery = async (msg, searchTerm) => {
  try {
    const json = await getData({
      provider,
      msg,
      searchTerm,
      isInvalidData: json => json.length === 0,
    });

    if (!json) {
      return;
    }

    const total = json.length;

    const firstTenResults = json
      .splice(0, 10)
      .map(({ package: { name, version, description, links } }) => ({
        name: `${name}@${version}`,
        description,
        url: links.npm,
      }));

    if (firstTenResults.length === 1) {
      await handleResult(msg, firstTenResults[0], null);
      return;
    }

    const embed = createListEmbed({
      provider,
      searchTerm,
      url: '',
      footerText: `${total} packages found`,
      description: createDescription(
        firstTenResults.map(({ name, description, url }, index) => {
          const truncatedDescription =
            description && description.length > 0
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
    const result = await getChosenResult(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    await handleResult(msg, result, sentMsg);
  } catch (error) {
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

/**
 *
 * @param {import('discord.js').Message} msg
 * @param {{name: string; description: string;}} result
 * @param {import('discord.js').Message} sentMsg
 */
const handleResult = async (msg, { name, description }, sentMsg) => {
  const { error, json: extendedJson } = await useData(
    getExtendedInfoUrl(provider, name),
  );

  if (error) {
    await msg.reply(errors.invalidResponse);
    return;
  }

  const {
    dependencyCount: dependencies,
    gzip,
    hasJSModule,
    hasSideEffects,
  } = extendedJson;
  const isTreeShakeable = !!hasJSModule;
  const estDownloadTimeEmerging3g = calcDownloadTime(gzip, '3g');
  const estDownloadTimeEdge = calcDownloadTime(gzip, 'edge');

  const previousVersionSize = await getPreviousVersionSize(name);
  const similarPackages = await getSimilarPackages(name);

  const embed = createEmbed({
    provider,
    title: name,
    footerText: 'Sizes are always gzipped.',
    description,
    url: buildDirectUrl(provider, name),
    fields: createFields({
      gzip,
      previousVersionSize,
      dependencies,
      hasSideEffects,
      isTreeShakeable,
      estDownloadTimeEdge,
      estDownloadTimeEmerging3g,
      similarPackages,
    }),
  });

  if (!sentMsg) {
    await msg.reply(embed);
  }

  await attemptEdit(sentMsg, embed);
};

/**
 *
 * @param {number} current
 * @param {number | undefined} last
 */
const getInitialFieldValue = (current, last) => {
  const currentInKb = toKilobytes(current);

  if (!last) {
    return currentInKb;
  }

  if (current === last) {
    return `${currentInKb} (no size diff)`;
  }

  const sizeDiff = calcDiffInPercent(current, last);
  const prefix = sizeDiff > 0 ? '+' : '';

  return `${currentInKb}\n(${prefix}${sizeDiff.toFixed(2)}% to last)`;
};

/**
 *
 * @param {{
 * gzip: number;
 * previousVersionSize?: number;
 * dependencies: number;
 * hasSideEffects: boolean;
 * isTreeShakeable: boolean;
 * estDownloadTimeEdge: string;
 * estDownloadTimeEmerging3g: string;
 * similarPackages: {label: string|undefined, packages: {name: string; size: number}[]};
 * }} param0
 */
const createFields = ({
  gzip,
  previousVersionSize,
  dependencies,
  hasSideEffects,
  isTreeShakeable,
  estDownloadTimeEdge,
  estDownloadTimeEmerging3g,
  similarPackages = { label: undefined, packages: [] },
}) => {
  const fields = [
    {
      name: 'size (latest)',
      value: getInitialFieldValue(gzip, previousVersionSize),
      inline: true,
    },
  ];

  fields.push({
    name: 'size (previous)',
    value: previousVersionSize ? toKilobytes(previousVersionSize) : 'unknown',
    inline: true,
  });

  fields.push({
    name: 'dependencies',
    value: dependencies,
    inline: true,
  });

  fields.push(EMPTY_FIELD);

  fields.push({
    name: 'treeshakable?',
    value: isTreeShakeable ? emojis.yes : emojis.no,
    inline: true,
  });

  fields.push({
    name: 'side effects?',
    value: hasSideEffects ? emojis.exclamation + 'yes' : emojis.yes + 'no',
    inline: true,
  });

  fields.push({
    name: 'download on edge',
    value: estDownloadTimeEdge,
    inline: true,
  });

  fields.push({
    name: 'download on 3g',
    value: estDownloadTimeEmerging3g,
    inline: true,
  });

  if (similarPackages.packages.length > 0) {
    const { label, packages } = similarPackages;

    fields.push(EMPTY_FIELD);

    fields.push({
      name: 'Similar packages',
      value: `labelled as _${label}_`,
    });

    for (let i = 0; i <= packages.length - 1; i++) {
      const { name, size } = packages[i];

      fields.push({
        name,
        value: toKilobytes(size),
        inline: true,
      });
    }
  }

  return fields;
};

/**
 *
 * @param {number} current
 * @param {number} previous
 */
const calcDiffInPercent = (current, previous) =>
  (current / previous) * 100 - 100;

const getPreviousVersionSize = async package => {
  const { error, json } = await useData(
    `https://bundlephobia.com/api/package-history?package=${package}`,
  );

  if (error) {
    return undefined;
  }

  const versions = Object.keys(json);

  if (versions.length <= 1) {
    return undefined;
  }

  try {
    const [, previous] = versions.sort(compareVersions).reverse();

    return json[previous].gzip || undefined;
  } catch (error) {
    return undefined;
  }
};

/**
 *
 * @param {number} size
 */
const toKilobytes = size => (size / 1024).toFixed(2) + 'kb';

const calcDownloadTime = (size, type) => {
  switch (type) {
    case '3g':
      if (size > 1024) {
        return (size / 1024 / 50).toFixed(2) + 's';
      }

      return (size / 50).toFixed(2) + 'ms';
    case 'edge':
      if (size > 1024) {
        return (size / 1024 / 30).toFixed(2) + 's';
      }

      return (size / 30).toFixed(2) + 'ms';
    default:
      throw new Error('unimplemented calcDownloadTime case');
  }
};

/**
 *
 * @param {string} package
 */
const getSimilarPackages = async package => {
  const url = `https://bundlephobia.com/api/similar-packages?package=${package}`;
  const { error, json } = await useData(url);

  if (error || !json.category.similar) {
    return undefined;
  }

  const { similar, label } = json.category;

  const packages = await Promise.all(
    similar
      .map(async otherPackage => {
        const { error, json } = await useData(
          getExtendedInfoUrl(provider, otherPackage),
        );

        if (error) {
          return undefined;
        }

        return {
          name: otherPackage,
          size: json.gzip,
        };
      })
      .filter(Boolean),
  );

  return {
    label,
    packages: packages,
  };
};

module.exports = handleBundlephobiaQuery;
