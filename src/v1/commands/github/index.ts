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
  attemptEdit,
  Embed,
} from '../../utils/discordTools';
import * as emojis from '../../utils/emojis';
import * as errors from '../../utils/errors';
import { getData } from '../../utils/urlTools';
import useData from '../../utils/useData';
import { GithubResponse, License, LicenseContent } from './types';

const provider = 'github';

const headers = {
  Accept: 'application/vnd.github.v3+json',
};

const licenseCache = {};

export const buildGithubQueryHandler = (
  fetch: typeof getData = getData,
  fetchDetails: typeof useData = useData,
  waitForResponse: typeof getChosenResult = getChosenResult
) => async (msg: Message, searchTerm: string) => {
  try {
    const json = await fetch<GithubResponse>({
      headers,
      isInvalidData: json => json.total_count === 0 || json.items.length === 0,
      msg,
      provider,
      searchTerm,
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
              license.url = licenseCache[key]
                ? licenseCache[key]
                : await extractAndCacheLicense(license, fetchDetails);
            }

            return {
              created: created_at,
              description,
              forks: forks_count.toString(),
              homepage,
              issues: open_issues,
              language,
              license: hasLicense
                ? {
                    name: license.name,
                    url: license.url,
                  }
                : undefined,
              name: full_name,
              owner: {
                avatar: owner.avatar_url,
                name: owner.login,
                type: owner.type,
              },
              stars: stargazers_count,
              updated: updated_at,
              url: html_url,
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
        provider,
        searchTerm,
        url: `https://github.com/search?q=${encodeURI(searchTerm)}`,
      })
    );

    const result = await waitForResponse(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    await attemptEdit(sentMsg, createEmbed(createGithubEmbed(result)));
  } catch (error) {
    // eslint-disable-next-line no-console
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

const createGithubEmbed = (
  result: ModifiedGithubResponseItem,
  formatDateFromNow: typeof formatDistanceToNow = formatDistanceToNow
): Embed => {
  const { name: title, owner, description, url, updated, created } = result;

  return {
    author: {
      icon_url: owner.avatar,
      name: `${owner.name} ${
        owner.type === 'Organization' ? '(Organization)' : ''
      }`,
      url: `https://github.com/${owner.name}`,
    },
    description,
    fields: createFields(result),
    footerText: [
      `updated ${formatDateFromNow(new Date(updated))} ago`,
      `created ${formatDateFromNow(new Date(created))} ago`,
    ].join(' - '),
    provider,
    title,
    url,
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
      inline: false,
      name: 'clone via...',
      value: createMarkdownBash(`git clone ${url}`),
    },
    {
      inline: true,
      name: `${emojis.warning} open issues`,
      value: createMarkdownLink(issues.toLocaleString(), url + '/issues'),
    },
    {
      inline: true,
      name: `${emojis.star} stars`,
      value: createMarkdownLink(stars.toLocaleString(), url + '/stargazers'),
    },
    {
      inline: true,
      name: `${emojis.forks} forks`,
      value: createMarkdownLink(
        forks.toLocaleString(),
        url + '/network/members'
      ),
    },
  ];

  if (homepage) {
    const { protocol } = new URL(homepage);

    const title = homepage.replace(`${protocol}//`, '');

    fields.push({
      inline: true,
      name: `${emojis.website} homepage`,
      value: createMarkdownLink(
        title.endsWith('/')
          ? title.slice(0, Math.max(0, title.length - 1))
          : title,
        homepage
      ),
    });
  }

  if (license) {
    fields.push({
      inline: true,
      name: `${emojis.license} license`,
      value:
        license.url.length > 0
          ? createMarkdownLink(license.name, license.url)
          : license.name,
    });
  }

  if (language) {
    fields.push({
      inline: false,
      name: `${emojis.language} language`,
      value: language,
    });
  }

  return fields;
};

const extractAndCacheLicense = async (
  { url, spdx_id }: License,
  fetch: typeof useData
) => {
  const { error, json } = await fetch<LicenseContent>(url);

  if (error) {
    return '';
  }

  // cache to prevent continuos requests
  licenseCache[spdx_id] = json.html_url;

  return json.html_url;
};

export default buildGithubQueryHandler();
