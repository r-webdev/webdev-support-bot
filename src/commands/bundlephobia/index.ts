import * as compareVersions from 'compare-versions';
import { Message, EmbedField } from 'discord.js';

import {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  createMarkdownListItem,
  createDescription,
  adjustDescriptionLength,
  getChosenResult,
  EMPTY_FIELD,
  attemptEdit,
} from '../../utils/discordTools';
import * as emojis from '../../utils/emojis';
import * as errors from '../../utils/errors';
import {
  getExtendedInfoUrl,
  buildDirectUrl,
  getData,
} from '../../utils/urlTools';
import useData from '../../utils/useData';
import {
  BundlephobiaResponse,
  ExtendedBundlephobiaResponse,
  Fields,
  SimilarPackagesResponse,
} from './types';

const provider = 'bundlephobia';

export const buildBundlephobiaQueryHandler = (
  fetch: typeof getData = getData,
  fetchDetail: typeof useData = useData,
  waitForResponse: typeof getChosenResult = getChosenResult
) => async (msg: Message, searchTerm: string) => {
  try {
    const json = await fetch<BundlephobiaResponse[]>({
      isInvalidData: json => json.length === 0,
      msg,
      provider,
      searchTerm,
    });

    if (!json) {
      return;
    }

    const total = json.length;

    const firstTenResults = json
      .splice(0, 10)
      .map(({ package: { name, version, description, links } }) => ({
        description,
        name: `${name}@${version}`,
        url: links.npm,
      }));

    if (firstTenResults.length === 1) {
      await handleResult(msg, firstTenResults[0], null, fetchDetail);
      return;
    }

    const embed = createListEmbed({
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
            createMarkdownLink(linkTitle, url)
          );
        })
      ),
      footerText: `${total} packages found`,
      provider,
      searchTerm,
      url: '',
    });

    const sentMsg = await msg.channel.send(embed);
    const result = await waitForResponse(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    await handleResult(msg, result, sentMsg, fetchDetail);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

const handleResult = async (
  msg: Message,
  { name, description }: { name: string; description: string },
  sentMsg: Message,
  fetch: typeof useData
) => {
  const { error, json: extendedJson } = await fetch<
    ExtendedBundlephobiaResponse
  >(getExtendedInfoUrl(provider, name));

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

  const previousVersionSize = await getPreviousVersionSize(name, fetch);
  const similarPackages = await getSimilarPackages(name, fetch);

  const embed = createEmbed({
    description,
    fields: createFields({
      dependencies,
      estDownloadTimeEdge,
      estDownloadTimeEmerging3g,
      gzip,
      hasSideEffects,
      isTreeShakeable,
      previousVersionSize,
      similarPackages,
    }),
    footerText: 'Sizes are always gzipped.',
    provider,
    title: name,
    url: buildDirectUrl(provider, name),
  });

  if (!sentMsg) {
    await msg.reply(embed);
  }

  await attemptEdit(sentMsg, embed);
};

const getInitialFieldValue = (current: number, last: number | undefined) => {
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

const createFields = ({
  gzip,
  previousVersionSize,
  dependencies,
  hasSideEffects,
  isTreeShakeable,
  estDownloadTimeEdge,
  estDownloadTimeEmerging3g,
  similarPackages = { label: undefined, packages: [] },
}: Fields) => {
  const fields: EmbedField[] = [
    {
      inline: true,
      name: 'size (latest)',
      value: getInitialFieldValue(gzip, previousVersionSize),
    },
  ];

  fields.push({
    inline: true,
    name: 'size (previous)',
    value: previousVersionSize ? toKilobytes(previousVersionSize) : 'unknown',
  });

  fields.push({
    inline: true,
    name: 'dependencies',
    value: '' + dependencies,
  });

  fields.push(EMPTY_FIELD);

  fields.push({
    inline: true,
    name: 'treeshakable?',
    value: isTreeShakeable ? emojis.yes : emojis.no,
  });

  fields.push({
    inline: true,
    name: 'side effects?',
    value: hasSideEffects ? emojis.exclamation + ' yes' : emojis.yes + ' no',
  });

  fields.push({
    inline: true,
    name: 'download on edge',
    value: estDownloadTimeEdge,
  });

  fields.push({
    inline: true,
    name: 'download on 3g',
    value: estDownloadTimeEmerging3g,
  });

  if (similarPackages.packages.length > 0) {
    const { label, packages } = similarPackages;

    fields.push(EMPTY_FIELD);

    fields.push({
      inline: false,
      name: 'Similar packages',
      value: `labelled as _${label}_`,
    });

    for (let i = 0; i <= 2; i++) {
      if (packages[i]) {
        const { name, size } = packages[i];

        fields.push({
          inline: true,
          name,
          value: toKilobytes(size),
        });
      }
    }
  }

  return fields;
};

const calcDiffInPercent = (current: number, previous: number) =>
  (current / previous) * 100 - 100;

const toKilobytes = (size: number) => (size / 1024).toFixed(2) + 'kb';

const calcDownloadTime = (size: number, type: '3g' | 'edge') => {
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

const getPreviousVersionSize = async (pkg: string, fetch: typeof useData) => {
  const { error, json } = await fetch(
    `https://bundlephobia.com/api/package-history?package=${pkg}`
  );

  if (error) {
    return;
  }

  const versions = Object.keys(json);

  if (versions.length <= 1) {
    return;
  }

  try {
    const [, previous] = versions.sort(compareVersions).reverse();

    return json[previous].gzip || undefined;
  } catch {
    return;
  }
};

const getSimilarPackages = async (pkg: string, fetch: typeof useData) => {
  const url = `https://bundlephobia.com/api/similar-packages?package=${pkg}`;
  const { error, json } = await fetch<SimilarPackagesResponse>(url);

  if (error || !json.category.similar) {
    return;
  }

  const { similar, label } = json.category;

  const packages = await Promise.all(
    similar
      .map(async otherPackage => {
        const { error, json } = await fetch<ExtendedBundlephobiaResponse>(
          getExtendedInfoUrl(provider, otherPackage)
        );

        if (error) {
          return;
        }

        return {
          name: otherPackage,
          size: json.gzip,
        };
      })
      .filter(Boolean)
  );

  return {
    label,
    packages,
  };
};

export default buildBundlephobiaQueryHandler();
