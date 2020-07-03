import * as compareVersions from 'compare-versions';
import { formatDistanceToNow } from 'date-fns';
import { Message, EmbedField } from 'discord.js';
import { URL } from 'url';

import {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  createMarkdownListItem,
  createDescription,
  adjustDescriptionLength,
  getChosenResult,
  createMarkdownBash,
  EMPTY_FIELD,
  attemptEdit,
} from '../../utils/discordTools';
import { dependencies, website, language } from '../../utils/emojis';
import * as errors from '../../utils/errors';
import {
  getExtendedInfoUrl,
  buildDirectUrl,
  getData,
} from '../../utils/urlTools';
import useData from '../../utils/useData';
import {
  PackagistResponse,
  ExtendedPackagistResponse,
  Downloads,
  Versions,
  Version,
} from './types';

const provider = 'composer';

export const buildComposerQueryHandler = (
  fetch: typeof getData = getData,
  fetchUse: typeof useData = useData,
  waitForChoice: typeof getChosenResult = getChosenResult,
  formatDateToNow: typeof formatDistanceToNow = formatDistanceToNow
) => async (msg: Message, searchTerm: string) => {
  try {
    const json = await fetch<PackagistResponse>({
      isInvalidData(json: PackagistResponse) {
        return json.results.length === 0;
      },
      msg,
      provider,
      searchTerm,
    });

    if (!json) {
      return;
    }

    const { total, results } = json;

    const firstTenResults = results
      .splice(0, 10)
      .map(({ name, description, repository, url, downloads, favers }) => ({
        description,
        downloads,
        name,
        repository,
        stars: favers,
        url,
      }));

    const embed = createListEmbed({
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
            createMarkdownLink(linkTitle, url)
          );
        })
      ),
      footerText: `${total} packages found`,
      provider,
      searchTerm,
      url: `https://packagist.org/?query=${encodeURI(searchTerm)}`,
    });

    const sentMsg = await msg.channel.send(embed);

    const result = await waitForChoice(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    const { name: resultName } = result;

    const { error, json: extendedJson } = await fetchUse<
      ExtendedPackagistResponse
    >(getExtendedInfoUrl(provider, resultName));

    if (error) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    const {
      package: { name, downloads, description, maintainers, versions },
    } = extendedJson;

    const { version, released } = findLatestRelease(versions, formatDateToNow);

    await attemptEdit(
      sentMsg,
      createEmbed({
        author: {
          icon_url: maintainers[0].avatar_url,
          name: maintainers[0].name,
        },
        description,
        fields: extractFieldsFromLatestRelease(versions[version]),
        footerText: generateDetailedFooter(downloads, released),
        provider,
        title: `${name} *(${version})*`,
        url: buildDirectUrl(provider, name),
      })
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

const findLatestRelease = (
  versions: Versions,
  formatDateToNow: typeof formatDistanceToNow
) => {
  const maybeResult = Object.values(versions).reduce((latest, item) => {
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
  });

  const { version, time } = maybeResult;

  return {
    released: formatDateToNow(new Date(time)),
    version,
  };
};

const extractFieldsFromLatestRelease = ({
  name,
  keywords,
  require,
  license,
  homepage,
  source,
  authors,
}: Version): EmbedField[] => {
  const fields = [
    {
      inline: false,
      name: 'add to your project',
      value: createMarkdownBash(`composer require ${name}`),
    },
  ];

  if (keywords.length > 0) {
    fields.push({
      inline: false,
      name: `${keywords} keywords`,
      value: keywords
        .map(keyword => createMarkdownLink(keyword, createTagLink(keyword)))
        .join(', '),
    });
  }

  const phpRequirement = Object.entries(require).find(
    ([dependency]) => dependency === 'php'
  );

  if (phpRequirement) {
    fields.push({
      inline: true,
      name: 'PHP version',
      value: '' + phpRequirement[1],
    });
  }

  fields.push({
    inline: true,
    name: `${dependencies} dependencies`,
    value: (Object.keys(require).length - (phpRequirement ? 1 : 0)).toString(),
  });

  if (license) {
    fields.push({
      inline: true,
      name: `${license} license`,
      value: license
        .map(license =>
          createMarkdownLink(
            license,
            `https://choosealicense.com/licenses/${license.toLowerCase()}`
          )
        )
        .join(' '),
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
      inline: true,
      name: `${website} homepage`,
      value: createMarkdownLink(
        homepage.replace(`${protocol}//`, ''),
        homepage
      ),
    });

    addedLinks++;
  }

  if (source) {
    if (source.url.endsWith('.git')) {
      const { pathname } = new URL(source.url);

      fields.push({
        inline: true,
        name: 'repository',
        value: createMarkdownLink(
          pathname.slice(1).replace('.git', ''),
          source.url.replace('.git', '')
        ),
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
      inline: true,
      name: `${language} author`,
      value: author.name,
    });
  });

  return fields;
};

const createTagLink = (tag: string) =>
  `https://packagist.org/search/?tags=${tag}`;

const generateDetailedFooter = (downloads: Downloads, released: string) =>
  `Downloads: ${Object.entries(downloads)
    .reverse()
    .map(([period, amount]) => `${amount.toLocaleString()} ${period}`)
    .join(' | ')}\nlast updated ${released} ago`;

export default buildComposerQueryHandler();
