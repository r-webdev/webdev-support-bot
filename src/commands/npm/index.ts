import { getData } from '../../utils/urlTools';
import * as errors from '../../utils/errors';
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
import { formatDistanceToNow } from 'date-fns';
import { website, language } from '../../utils/emojis';
import { Message, EmbedField } from 'discord.js';
import { URL } from 'url';
import { NPMResponse } from './types';

const provider = 'npm';

const handleNPMQuery = async (msg: Message, searchTerm: string) => {
  try {
    const json = await getData<NPMResponse[]>({
      msg,
      searchTerm,
      provider,
      isInvalidData: json => json.length === 0,
    });

    if (!json) {
      return;
    }

    const firstTenResults = json
      .splice(0, 10)
      .map(({ name, date, description, links, publisher, maintainers }) => ({
        lastUpdate: `${formatDistanceToNow(new Date(date))} ago`,
        url: links.npm,
        externalUrls: {
          homepage: links.homepage,
          repository: links.repository,
        },
        author: {
          name: publisher.username,
          //icon_url: publisher.avatars.small,
          url: `https://www.npmjs.com/~${publisher.username}`,
        },
        name,
        description,
        maintainers: maintainers.length,
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
        provider,
        url: `https://npmjs.com/search?q=${encodeURI(searchTerm)}`,
        footerText:
          firstTenResults.length < 10
            ? `${firstTenResults.length} packages found`
            : `at least ${firstTenResults.length.toLocaleString()} packages found`,
        searchTerm,
        description,
      })
    );

    const result = await getChosenResult(sentMsg, msg, firstTenResults);

    if (!result) {
      return;
    }

    await attemptEdit(sentMsg, createEmbed(createNPMEmbed(result)));
  } catch (error) {
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
  provider,
  title: name,
  url,
  footerText: `last updated ${lastUpdate}`,
  description,
  author,
  fields: createFields(name, externalUrls, maintainers),
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
    name: 'add to your project',
    value: createMarkdownBash(
      ['npm install', 'yarn add'].map(cmd => [cmd, name].join(' ')).join('\n')
    ),
    inline: false,
  },
  ...Object.entries(externalUrls)
    .filter(([, url]) => !!url)
    .map(([host, url]) => {
      const markdownTitle = sanitizePackageLink(host, url);

      const emoji = host === 'homepage' ? website : false;

      return {
        name: emoji ? `${emoji} ${host}` : host,
        value: createMarkdownLink(
          markdownTitle.endsWith('/')
            ? markdownTitle.substr(0, markdownTitle.length - 1)
            : markdownTitle,
          url
        ),
        inline: true,
      };
    }),
  {
    name: `${language} maintainers`,
    value: maintainers.toString(),
    inline: true,
  },
];

const sanitizePackageLink = (host: string, link: string) => {
  const { protocol, pathname } = new URL(link);

  if (host === 'homepage') {
    return link.replace(`${protocol}//`, '');
  }

  if (host === 'repository') {
    return pathname.startsWith('/') ? pathname.substring(1) : pathname;
  }

  return link;
};

export default handleNPMQuery;
