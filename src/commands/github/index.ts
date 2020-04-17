import { getData } from '../../utils/urlTools';
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
  attemptEdit,
  Embed,
} from '../../utils/discordTools';
import { formatDistanceToNow } from 'date-fns';
import useData from '../../utils/useData';
import * as emojis from '../../utils/emojis';
import { Message, EmbedField } from 'discord.js';
import {
  GithubResponse,
  License,
  LicenseContent,
  GithubResponseItem,
} from './types';
import { URL } from 'url';

const provider = 'github';

const headers = {
  Accept: 'application/vnd.github.v3+json',
};

const licenseCache = {};

const handleGithubQuery = async (msg: Message, searchTerm: string) => {
  try {
    const json = await getData<GithubResponse>({
      msg,
      provider,
      searchTerm,
      headers,
      isInvalidData: (json) =>
        json.total_count === 0 || json.items.length === 0,
    });

    if (!json) {
      return;
    }

    const firstTenResults = await Promise.all(
      json.items
        .splice(0, 10)
        .map(
          async ({
            description,
            full_name,
            html_url,
            created_at,
            updated_at,
            homepage,
            stargazers_count,
            forks_count,
            license,
            open_issues,
            owner,
            language,
          }) => {
            const hasLicense =
              license && license.spdx_id !== 'NOASSERTION' && license.url;

            if (hasLicense) {
              const key = license.spdx_id;
              // eslint-disable-next-line require-atomic-updates
              license.url = licenseCache[key]
                ? licenseCache[key]
                : await extractAndCacheLicense(license);
            }

            return {
              description,
              name: full_name,
              url: html_url,
              homepage,
              issues: open_issues,
              stars: stargazers_count,
              forks: forks_count.toString(),
              license: hasLicense
                ? {
                    url: license.url,
                    name: license.name,
                  }
                : undefined,
              created: created_at,
              updated: updated_at,
              owner: {
                name: owner.login,
                type: owner.type,
                avatar: owner.avatar_url,
              },
              language,
            };
          }
        )
    );

    if (firstTenResults.length === 1) {
      await msg.channel.send(
        createEmbed(createGithubEmbed(firstTenResults[0]))
      );
      return;
    }

    const sentMsg = await msg.channel.send(
      createListEmbed({
        provider,
        searchTerm,
        url: `https://github.com/search?q=${encodeURI(searchTerm)}`,
        description: createDescription(
          firstTenResults.map(({ name, description, url }, index) => {
            const title = description
              ? `**${name}** - *${adjustDescriptionLength(
                  index,
                  name,
                  description
                )}*`
              : `**${name}**`;

            return createMarkdownListItem(
              index,
              createMarkdownLink(title, url)
            );
          })
        ),
        footerText: `${json.total_count.toLocaleString()} results`,
      })
    );

    const result = await getChosenResult(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    await attemptEdit(sentMsg, createEmbed(createGithubEmbed(result)));
  } catch (error) {
    console.error(`${error.name}: ${error.message}`);
    await msg.reply(errors.unknownError);
  }
};

interface ModifiedGithubResponseItem {
  name: string;
  owner: {
    name: string;
    type: string;
    avatar: string;
  };
  description: string;
  url: string;
  updated: Date;
  created: Date;

  language: string;
  stars: number;
  forks: string;
  issues: number;
  homepage?: string;
  license?: { url: string; name: string };
}

const createGithubEmbed = (result: ModifiedGithubResponseItem): Embed => {
  const { name: title, owner, description, url, updated, created } = result;

  return {
    provider,
    title,
    url,
    author: {
      name: `${owner.name} ${
        owner.type === 'Organization' ? '(Organization)' : ''
      }`,
      url: `https://github.com/${owner.name}`,
      icon_url: owner.avatar,
    },
    description,
    footerText: [
      `updated ${formatDistanceToNow(new Date(updated))} ago`,
      `created ${formatDistanceToNow(new Date(created))} ago`,
    ].join(' - '),
    fields: createFields(result),
  };
};

const createFields = ({
  language,
  issues,
  url,
  forks,
  homepage,
  license,
  stars,
}: ModifiedGithubResponseItem): EmbedField[] => {
  const fields = [
    {
      name: 'clone via...',
      value: createMarkdownBash(`git clone ${url}`),
      inline: false,
    },
    {
      name: `${emojis.warning} open issues`,
      value: createMarkdownLink(issues.toLocaleString(), url + '/issues'),
      inline: true,
    },
    {
      name: `${emojis.star} stars`,
      value: createMarkdownLink(stars.toLocaleString(), url + '/stargazers'),
      inline: true,
    },
    {
      name: `${emojis.forks} forks`,
      value: createMarkdownLink(
        forks.toLocaleString(),
        url + '/network/members'
      ),
      inline: true,
    },
  ];

  if (homepage) {
    const { protocol } = new URL(homepage);

    const title = homepage.replace(`${protocol}//`, '');

    fields.push({
      name: `${emojis.website} homepage`,
      value: createMarkdownLink(
        title.endsWith('/') ? title.substr(0, title.length - 1) : title,
        homepage
      ),
      inline: true,
    });
  }

  if (license) {
    fields.push({
      name: `${emojis.license} license`,
      value:
        license.url.length > 0
          ? createMarkdownLink(license.name, license.url)
          : license.name,
      inline: true,
    });
  }

  if (language) {
    fields.push({
      name: `${emojis.language} language`,
      value: language,
      inline: false,
    });
  }

  return fields;
};

const extractAndCacheLicense = async ({ url, spdx_id }: License) => {
  const { error, json } = await useData<LicenseContent>(url);

  if (error) {
    return '';
  }

  // cache to prevent continuos requests
  licenseCache[spdx_id] = json.html_url;

  return json.html_url;
};

export default handleGithubQuery;
