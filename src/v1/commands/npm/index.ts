import { formatDistanceToNow } from 'date-fns';
import { Message, EmbedField } from 'discord.js';
import { URL } from 'url';

import {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  adjustDescriptionLength,
  createDescription,
  createMarkdownListItem,
  getChosenResult,
  createMarkdownBash,
  attemptEdit,
  Embed,
} from '../../utils/discordTools';
import { website, language } from '../../utils/emojis';
import * as errors from '../../utils/errors';
import { getData } from '../../utils/urlTools';
import { NPMResponse } from './types';

const provider = 'npm';

export const buildNPMQueryHandler = (
  fetch: typeof getData = getData,
  waitForResponse: typeof getChosenResult = getChosenResult,
  formatDateFromNow: typeof formatDistanceToNow = formatDistanceToNow
) => async (msg: Message, searchTerm: string) => {
  try {
    const json = await fetch<NPMResponse[]>({
      isInvalidData: json => json.length === 0,
      msg,
      provider,
      searchTerm,
    });

    if (!json) {
      return;
    }

    const firstTenResults = json
      .splice(0, 10)
      .map(({ name, date, description, links, publisher, maintainers }) => ({
        author: {
          name: publisher.username,
          //icon_url: publisher.avatars.small,
          url: `https://www.npmjs.com/~${publisher.username}`,
        },
        description,
        externalUrls: {
          homepage: links.homepage,
          repository: links.repository,
        },
        lastUpdate: `${formatDateFromNow(new Date(date))} ago`,
        maintainers: maintainers.length,
        name,
        url: links.npm,
      }));

    if (firstTenResults.length === 1) {
      await msg.channel.send(createEmbed(createNPMEmbed(firstTenResults[0])));
      return;
    }

    const description = createDescription(
      firstTenResults.map(({ name, description, url }, index) => {
        // cant guarantee syntactically correct markdown image links due to
        // npm limiting description to 255 chars,
        // hence ignore description in those cases
        // e.g. redux-react-session
        const hasMarkdownImageLink = description
          ? description.includes('[!')
          : true;

        const linkTitle = hasMarkdownImageLink
          ? `**${name}**`
          : `**${name}** - *${adjustDescriptionLength(
              index + 1,
              name,
              description
            )}*`;

        return createMarkdownListItem(
          index,
          createMarkdownLink(linkTitle, url)
        );
      })
    );

    const sentMsg = await msg.channel.send(
      createListEmbed({
        description,
        footerText:
          firstTenResults.length < 10
            ? `${firstTenResults.length} packages found`
            : `at least ${firstTenResults.length.toLocaleString()} packages found`,
        provider,
        searchTerm,
        url: `https://npmjs.com/search?q=${encodeURI(searchTerm)}`,
      })
    );

    const result = await waitForResponse(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    await attemptEdit(sentMsg, createEmbed(createNPMEmbed(result)));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

interface NPMEmbed {
  externalUrls: { homepage: string; repository: string };
  name: string;
  url: string;
  description: string;
  lastUpdate: string;
  maintainers: number;
  author: { name: string; url: string };
}

const createNPMEmbed = ({
  externalUrls,
  name,
  url,
  description,
  lastUpdate,
  maintainers,
  author,
}: NPMEmbed): Embed => ({
  author,
  description,
  fields: createFields(name, externalUrls, maintainers),
  footerText: `last updated ${lastUpdate}`,
  provider,
  title: name,
  url,
});

/**
 *  Creates fields for all links except npm since that ones in the title already
 *
 */
const createFields = (
  name: string,
  externalUrls: { homepage: string; repository: string },
  maintainers: number
): EmbedField[] => [
  {
    inline: false,
    name: 'add to your project',
    value: createMarkdownBash(
      ['npm install', 'yarn add'].map(cmd => [cmd, name].join(' ')).join('\n')
    ),
  },
  ...Object.entries(externalUrls)
    .filter(([, url]) => !!url)
    .map(([host, url]) => {
      const markdownTitle = sanitizePackageLink(host, url);

      const emoji = host === 'homepage' ? website : false;

      return {
        inline: true,
        name: emoji ? `${emoji} ${host}` : host,
        value: createMarkdownLink(
          markdownTitle.endsWith('/')
            ? markdownTitle.slice(0, Math.max(0, markdownTitle.length - 1))
            : markdownTitle,
          url
        ),
      };
    }),
  {
    inline: true,
    name: `${language} maintainers`,
    value: maintainers.toString(),
  },
];

const sanitizePackageLink = (host: string, link: string) => {
  const { protocol, pathname } = new URL(link);

  if (host === 'homepage') {
    return link.replace(`${protocol}//`, '');
  }

  if (host === 'repository') {
    return pathname.startsWith('/') ? pathname.slice(1) : pathname;
  }

  return link;
};

export default buildNPMQueryHandler();
