import { formatDistanceToNow } from 'date-fns';
import type {
  EmbedField,
  Client,
  CommandInteraction,
  Message,
  ButtonInteraction,
  SelectMenuInteraction,
} from 'discord.js';
import {
  MessageEmbed,
  Collection,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
} from 'discord.js';
import type { MessageComponentTypes } from 'discord.js/typings/enums';
import { collect, take } from 'domyno';
import { URL } from 'url';

import type { CommandDataWithHandler } from '../../../types';
import { clampLengthMiddle, clampLength } from '../../utils/clampStr';
import type { Embed } from '../../utils/discordTools';
import {
  createMarkdownLink,
  createEmbed,
  createMarkdownBash,
} from '../../utils/discordTools';
import { website, language } from '../../utils/emojis';
import { unknownError } from '../../utils/errors';
import { map } from '../../utils/map';
import { pipe } from '../../utils/pipe';
import { getData } from '../../utils/urlTools';
import type { NPMResponse } from './types';

const provider = 'npm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const list = new (Intl as any).ListFormat();

const fetch: typeof getData = getData;
const formatDateFromNow: typeof formatDistanceToNow = formatDistanceToNow;

const getFirstTenResults = pipe<Iterable<NPMResponse>, NPMEmbed[]>([
  take<NPMResponse>(10),
  map(({ name, date, description, links, publisher, maintainers }) => ({
    author: {
      name: publisher.username,
      // icon_url: publisher.avatars.small,
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
  })),
  collect,
]);


// msg: Message, searchTerm: string
const handleNpmCommand = async (
  client: Client,
  interaction: CommandInteraction
): Promise<void> => {
  const searchTerm = interaction.options.getString('name');
  const defer = interaction.deferReply();
  try {
    const json = await fetch<NPMResponse[]>({
      isInvalidData: json => json.length === 0,
      msg: interaction,
      provider,
      searchTerm,
    });

    await defer;

    if (!json) {
      return;
    }

    const firstTenResults = getFirstTenResults(json);

    if (firstTenResults.length === 1) {
      await interaction.reply({
        content: '',
        embeds: [
          createEmbed(createNPMEmbed(firstTenResults[0])),
        ] as unknown as MessageEmbed[],
      });
      return;
    }

    const msgId = Math.random().toString(16);
    const collection = new Collection(
      firstTenResults.map(item => [item.url, item])
    );
    const selectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(`npm🤔${msgId}🤔select`)
        .setPlaceholder('Pick one option to display')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          firstTenResults.map(({ name, description, url }) => ({
            label: clampLengthMiddle(name, 25),
            description: clampLength(description, 50),
            value: url,
          }))
        )
    );
    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('Cancel')
        .setStyle('DANGER')
        .setCustomId(`npm🤔${msgId}🤔cancel`)
    );

    const int = (await interaction.editReply({
      content: 'Please pick 1 option below to display',
      components: [selectRow, buttonRow],
    })) as Message;

    const interactionCollector = int.createMessageComponentCollector<
      MessageComponentTypes.BUTTON | MessageComponentTypes.SELECT_MENU
    >({
      filter: item =>
        item.user.id === interaction.user.id &&
        item.customId.startsWith(`npm🤔${msgId}`),
    });

    interactionCollector.once(
      'collect',
      async (interaction: ButtonInteraction | SelectMenuInteraction) => {
        await interaction.deferUpdate();
        if (interaction.isButton()) {
          await int.delete();
          return;
        }
        const valueSet = new Set(interaction.values);
        const values = collection.filter((_, key) => valueSet.has(key));

        await interaction.editReply({
          content: `Displaying Results for ${list.format(
            values.map(({ name }) => name)
          )}`,
          components: [],
        });

        interaction.channel.send({
          content: `Results for "${searchTerm}"`,
          embeds: values.map(
            ({
              name,
              description,
              url,
              author,
              lastUpdate,
              maintainers,
              externalUrls,
            }) =>
              new MessageEmbed()
                .setAuthor(`📦 Last updated ${lastUpdate}`)
                .setTitle(`${name}`)
                .setThumbnail(
                  'https://static.npmjs.com/338e4905a2684ca96e08c7780fc68412.png'
                )
                .setDescription(
                  description
                    .split('\n')
                    .map(item => item.trim())
                    .join(' ')
                )
                .addFields(...createFields(name, externalUrls, maintainers), {
                  name: 'Author',
                  value: author.name,
                  inline: true,
                })
                .setURL(url)
                .setFooter(
                  `requested by ${interaction.user.username}#${interaction.user.discriminator}`,
                  interaction.user.avatarURL({ size: 64, format: 'webp' })
                )
                .setColor(0xcb_37_37)
          ),
        });
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    if (interaction.replied) {
      try {
        await interaction.reply(unknownError);
      } catch {
        await interaction.editReply(unknownError);
      }
    }
  }
};

type NPMEmbed = {
  externalUrls: { homepage: string; repository: string };
  name: string;
  url: string;
  description: string;
  lastUpdate: string;
  maintainers: number;
  author: { name: string; url: string };
};

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
    name: 'How to install',
    value: createMarkdownBash(
      [`npm install ${name}`, '# Or', `yarn add ${name}`].join('\n')
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

export const npmInteraction: CommandDataWithHandler = {
  description: 'Search npm for a given package',
  name: 'npm',
  options: [
    {
      name: 'name',
      description: 'The name of the package',
      type: 'STRING',
      required: true,
    },
  ],
  handler: handleNpmCommand,
};
