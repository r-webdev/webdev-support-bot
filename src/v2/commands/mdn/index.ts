/* eslint-disable unicorn/prefer-query-selector */
import type {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Message,
  SelectMenuInteraction,
} from 'discord.js';
import { MessageButton } from 'discord.js';
import {
  Collection,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
} from 'discord.js';
import { URL } from 'url';

import { ApplicationCommandOptionType } from '../../../enums';
import type { CommandDataWithHandler } from '../../../types';
import {
  adjustTitleLength,
  attemptEdit,
  BASE_DESCRIPTION,
  createDescription,
  createListEmbed,
  createMarkdownLink,
  createMarkdownListItem,
  getChosenResult,
} from '../../utils/discordTools';
import { invalidResponse, noResults, unknownError } from '../../utils/errors';
import { getSearchUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

const provider = 'mdn';

type SearchResponse = {
  query: string;
  locale: string;
  page: number;
  pages: number;
  starts: number;
  end: number;
  next: string;
  previous: string | null;
  count: number;
  filter: {
    name: string;
    slug: string;
    options: {
      name: string;
      slug: string;
      count: number;
      active: boolean;
      urls: {
        active: string;
        inactive: string;
      };
    }[];
  }[];
  documents: {
    title: string;
    slug: string;
    locale: string;
    summary: string;
  }[];
};

const fetch: typeof useData = useData;
const waitForChosenResult: typeof getChosenResult = getChosenResult;

const buildDirectUrl = (path: string) =>
  new URL(path, 'https://developer.mozilla.org/en-US/docs/').toString();

const clampLength = (str: string, maxLength: number): string => {
  if (str.length > maxLength) {
    return `${str.slice(0, maxLength - 3)}...`;
  }
  return str;
};

const clampLengthMiddle = (str: string, maxLength: number): string => {
  if (str.length > maxLength) {
    const firstHalf = str.slice(0, maxLength / 2 -3);
    const secondHalf = str.slice(str.length - maxLength / 2);
    return `${firstHalf}...${secondHalf}`;
  }
  return str;
};

const mdnHandler = async (
  client: Client,
  interaction: CommandInteraction
): Promise<unknown> => {
  const searchTerm: string = interaction.options.getString('query');
  const deferral = interaction.defer();
  try {
    const url = getSearchUrl(provider, searchTerm);
    const { error, json } = await fetch<SearchResponse>(url, 'json');

    if (error) {
      await interaction.reply({
        content: invalidResponse,
      });
      return;
    }

    if (json.documents.length === 0) {
      await interaction.reply({
        content: noResults(searchTerm),
      });
      return;
    }

    const msgId = Math.random().toString(16);
    const collection = new Collection(
      json.documents.map(item => [item.slug, item])
    );
    const selectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(`mdn🤔${msgId}🤔select`)
        .setPlaceholder('Pick one to 5 options to display')
        .setMinValues(1)
        .setMaxValues(5)
        .addOptions(
          json.documents.map(({ title, summary, slug }) => ({
            label: clampLengthMiddle(title, 25),
            description: clampLength(summary, 50),
            value: slug,
          }))
        )
    );
    const buttonRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('Cancel')
        .setStyle('DANGER')
        .setCustomId(`mdn🤔${msgId}🤔cancel`)
    );

    await deferral;
    const int = (await interaction.editReply({
      content: 'Please pick 1 - 5 options below to display',
      components: [selectRow, buttonRow],
    })) as Message;

    const interactionCollector = int.createMessageComponentCollector<
      SelectMenuInteraction | ButtonInteraction
    >({
      filter: item => item.user.id === interaction.user.id && item.customId.startsWith(`mdn🤔${msgId}`),
    });

    interactionCollector.once('collect', async interaction => {
      await interaction.deferUpdate();
      if (interaction.isButton()) {
        await int.delete();
        return;
      }
      const valueSet = new Set(interaction.values);
      const values = collection.filter((_, key) => valueSet.has(key));

      await interaction.editReply({
        content: `Results for "${searchTerm}"`,
        components: [],
        embeds: values.map(({ title, summary, slug }) =>
          new MessageEmbed()
            .setTitle(`${maybeClippy()} ${title}`)
            .setDescription(summary.split('\n').map(item => item.trim()).join(' '))
            .setURL(buildDirectUrl(slug))
            .setColor('WHITE')
        ),
      });
    });

    return;

    // const sentMsg = (await interaction.fetchReply()) as Message;

    // const result = await waitForChosenResult(
    //   sentMsg,
    //   { author: { id: interaction.member.user.id } },
    //   json.documents
    // );
    // if (!result) {
    //   return;
    // }

    // const editableUrl = buildDirectUrl(result.slug);
    // interaction.editReply({
    //   content: editableUrl,
    // });
  } catch (error) {
    console.error(error);
    interaction.reply(unknownError);
  }
};

export const mdnCommand: CommandDataWithHandler = {
  name: 'mdn',
  description: 'search mdn',
  handler: async (client, interaction): Promise<void> => {
    await mdnHandler(client, interaction);
  },
  options: [
    {
      name: 'query',
      description: 'query',
      type: 'STRING',
      required: true,
    },
  ],
};

function maybeClippy() {
  return Math.random() <= 1.01 ? '<:clippy:865257202915082254>' : '🔗';
}
