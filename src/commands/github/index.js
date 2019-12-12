const { getData } = require('../../utils/urlTools');
//eslint-disable-next-line no-unused-vars
const { Message } = require('discord.js');
const errors = require('../../utils/errors');
const {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  createMarkdownListItem,
  createDescription,
  adjustDescriptionLength,
  getChosenResult,
  createMarkdownBash,
} = require('../../utils/discordTools');
const { formatDistanceToNow } = require('date-fns');
const useData = require('../../utils/useData');

const provider = 'github';

const headers = {
  Accept: 'application/vnd.github.v3+json',
};

const licenseCache = {};

/**
 *
 * @param {Message} msg
 * @param {string} searchTerm
 */
const handleGithubQuery = async (msg, searchTerm) => {
  try {
    const json = await getData({
      msg,
      provider,
      searchTerm,
      headers,
      isInvalidData: json => json.total_count === 0 || json.items.length === 0,
    });

    if (!json) {
      return;
    }

    const { total_count, items } = json;

    const firstTenResults = await Promise.all(
      items
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
              forks: forks_count,
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
          },
        ),
    );

    if (firstTenResults.length === 1) {
      await msg.channel.send(
        createEmbed(createGithubEmbed(firstTenResults[0])),
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
                  description,
                )}*`
              : `**${name}**`;

            return createMarkdownListItem(
              index,
              createMarkdownLink(title, url),
            );
          }),
        ),
        footerText: `${total_count.toLocaleString()} results`,
      }),
    );

    const result = await getChosenResult(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    await sentMsg.edit(createEmbed(createGithubEmbed(result)));
  } catch (error) {
    console.error(`${error.name}: ${error.message}`);
    await msg.reply(errors.unknownError);
  }
};

/**
 *
 * @param {{
 *  name: string,
 *  owner: {},
 *  url: string,
 *   description?: string,
 *  updated: string,
 *  created, string}
 * }
 */
const createGithubEmbed = result => {
  const { name, owner, description, url, updated, created } = result;

  return {
    provider,
    title: name,
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

/**
 *
 * @param {{
 *  language: string,
 *  url: string,
 *  stars: number,
 *  forks: number,
 *  issues: number,
 *  homepage?: string,
 *  license?: { name: string, spdx_id: string, node_id: string, key: string, url: string }
 * }}
 */
const createFields = ({
  language,
  issues,
  url,
  forks,
  homepage,
  license,
  stars,
}) => {
  const fields = [
    {
      name: 'Language',
      value: language,
    },
    {
      name: 'clone via...',
      value: createMarkdownBash(`git clone ${url}`),
    },
    {
      name: 'open issues :warning:',
      value: createMarkdownLink(issues.toLocaleString(), url + '/issues'),
      inline: true,
    },
    {
      name: 'stars :star: ',
      value: createMarkdownLink(stars.toLocaleString(), url + '/stargazers'),
      inline: true,
    },
    {
      name: 'forks :fork_and_knife:',
      value: createMarkdownLink(
        forks.toLocaleString(),
        url + '/network/members',
      ),
      inline: true,
    },
  ];

  if (homepage) {
    const { protocol } = new URL(homepage);

    fields.push({
      name: 'homepage',
      value: createMarkdownLink(
        homepage.replace(`${protocol}//`, ''),
        homepage,
      ),
      inline: true,
    });
  }

  if (license) {
    fields.push({
      name: 'license',
      value:
        license.url.length > 0
          ? createMarkdownLink(license.name, license.url)
          : license.name,
      inline: true,
    });
  }

  return fields;
};

/**
 *
 * @param {{
 *  url: string,
 *  spdx_id: string
 * }}
 *
 * @returns Promise<string>
 */
const extractAndCacheLicense = async ({ url, spdx_id }) => {
  const { error, json } = await useData(url);

  if (error) {
    return '';
  }

  // cache to prevent continuos requests
  licenseCache[spdx_id] = json.html_url;

  return json.html_url;
};

module.exports = handleGithubQuery;
