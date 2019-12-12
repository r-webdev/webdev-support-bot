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
    const { total_count, items } = await getData({
      msg,
      provider,
      searchTerm,
      headers,
      isInvalidData: json => json.total_count === 0 || json.items.length === 0,
    });

    const firstTenResult = await Promise.all(
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
            const hasLicense = !!license;

            if (
              hasLicense &&
              license.spdx_id !== 'NOASSERTION' &&
              license.url
            ) {
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

    const embed = createListEmbed({
      provider,
      searchTerm,
      url: `https://github.com/search?q=${encodeURI(searchTerm)}`,
      description: createDescription(
        firstTenResult.map(({ name, description, url }, index) => {
          const title = description
            ? `**${name}** - *${adjustDescriptionLength(
                index,
                name,
                description,
              )}*`
            : `**${name}**`;

          return createMarkdownListItem(index, createMarkdownLink(title, url));
        }),
      ),
      footerText: `${total_count.toLocaleString()} results`,
    });

    const sentMsg = await msg.channel.send(embed);

    try {
      const {
        description,
        name,
        language,
        url,
        homepage,
        issues,
        stars,
        forks,
        license,
        created,
        updated,
        owner,
      } = await getChosenResult(sentMsg, msg, firstTenResult);

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
          name: 'Open Issues :warning:',
          value: createMarkdownLink(issues.toLocaleString(), url + '/issues'),
          inline: true,
        },
        {
          name: 'Stars :star: ',
          value: createMarkdownLink(
            stars.toLocaleString(),
            url + '/stargazers',
          ),
          inline: true,
        },
        {
          name: 'Forks :fork_and_knife:',
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
          name: 'Homepage',
          value: createMarkdownLink(
            homepage.replace(`${protocol}//`, ''),
            homepage,
          ),
          inline: true,
        });
      }

      if (license) {
        fields.push({
          name: 'License',
          value: createMarkdownLink(license.name, license.url),
          inline: true,
        });
      }

      const embed = createEmbed({
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
        fields,
      });

      await sentMsg.edit(embed);
    } catch (collected) {
      // nobody reacted, doesn't matter
    }
  } catch (error) {
    console.error(`${error.name}: ${error.message}`);
    await msg.reply(errors.unknownError);
  }
};

/**
 *
 * @param {{
 *  url: string,
 *  spdx_id: string
 * }}
 *
 * @returns Promise<string|undefined>
 */
const extractAndCacheLicense = async ({ url, spdx_id }) => {
  const { error, json } = await useData(url);

  if (!error) {
    // cache to prevent continuos requests
    licenseCache[spdx_id] = json.html_url;

    return json.html_url;
  }

  return undefined;
};

module.exports = handleGithubQuery;
