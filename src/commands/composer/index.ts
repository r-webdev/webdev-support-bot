import {
  getExtendedInfoUrl,
  buildDirectUrl,
  getData,
} from '../../utils/urlTools';
import * as errors from '../../utils/errors';
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
import useData from '../../utils/useData';
import * as compareVersions from 'compare-versions';
import { formatDistanceToNow } from 'date-fns';
import {
  dependencies,
  keywords,
  license,
  website,
  language,
} from '../../utils/emojis';
import { Message, EmbedField } from 'discord.js';
import { URL } from 'url';
import {
  PackagistResponse,
  ExtendedPackagistResponse,
  Downloads,
  Versions,
  Version,
} from './types';

const provider = 'composer';

const handleComposerQuery = async (msg: Message, searchTerm: string) => {
  try {
    const json = await getData<PackagistResponse>({
      provider,
      msg,
      searchTerm,
      isInvalidData(json: PackagistResponse) {
        return json.results.length === 0;
      },
    });

    if (!json) {
      return;
    }

    const { total, results } = json;

    const firstTenResults = results
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
      provider,
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
            createMarkdownLink(linkTitle, url)
          );
        })
      ),
    });

    const sentMsg = await msg.channel.send(embed);

    const result = await getChosenResult(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    const { name: resultName } = result;

    const { error, json: extendedJson } = await useData<
      ExtendedPackagistResponse
    >(getExtendedInfoUrl(provider, resultName));

    if (error) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    const {
      package: { name, downloads, description, maintainers, versions },
    } = extendedJson;

    const { version, released } = findLatestRelease(versions);

    await attemptEdit(
      sentMsg,
      createEmbed({
        provider,
        title: `${name} *(${version})*`,
        footerText: generateDetailedFooter(downloads, released),
        description,
        author: {
          icon_url: maintainers[0].avatar_url,
          name: maintainers[0].name,
        },
        url: buildDirectUrl(provider, name),
        fields: extractFieldsFromLatestRelease(versions[version]),
      })
    );
  } catch (error) {
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

const findLatestRelease = (versions: Versions) => {
  const { version, time } = Object.values(versions).reduce<Version>(
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
    null
  );

  return {
    version,
    released: formatDistanceToNow(new Date(time)),
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
      name: 'add to your project',
      value: createMarkdownBash(`composer require ${name}`),
      inline: false,
    },
  ];

  if (keywords.length > 0) {
    fields.push({
      name: `${keywords} keywords`,
      value: keywords
        .map(keyword => createMarkdownLink(keyword, createTagLink(keyword)))
        .join(', '),
      inline: false,
    });
  }

  const phpRequirement = Object.entries(require).find(
    ([dependency]) => dependency === 'php'
  );

  if (phpRequirement) {
    fields.push({
      name: 'PHP version',
      value: '' + phpRequirement[1],
      inline: true,
    });
  }

  fields.push({
    name: `${dependencies} dependencies`,
    value: (Object.keys(require).length - (phpRequirement ? 1 : 0)).toString(),
    inline: true,
  });

  if (license) {
    fields.push({
      name: `${license} license`,
      value: license
        .map(license =>
          createMarkdownLink(
            license,
            `https://choosealicense.com/licenses/${license.toLowerCase()}`
          )
        )
        .join(' '),
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
      name: `${website} homepage`,
      value: createMarkdownLink(
        homepage.replace(`${protocol}//`, ''),
        homepage
      ),
      inline: true,
    });

    addedLinks++;
  }

  if (source) {
    if (source.url.endsWith('.git')) {
      const { pathname } = new URL(source.url);

      fields.push({
        name: 'repository',
        value: createMarkdownLink(
          pathname.substr(1).replace('.git', ''),
          source.url.replace('.git', '')
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
      name: `${language} author`,
      value: author.name,
      inline: true,
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

export default handleComposerQuery;
