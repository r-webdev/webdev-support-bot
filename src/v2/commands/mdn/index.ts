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
import type { MessageComponentTypes } from 'discord.js/typings/enums';
import { URL } from 'url';

import type { CommandDataWithHandler } from '../../../types';
import { clampLength, clampLengthMiddle } from '../../utils/clampStr.js';
import { invalidResponse, noResults, unknownError } from '../../utils/errors.js';
import { getSearchUrl } from '../../utils/urlTools.js';
import useData from '../../utils/useData.js';


const list = new (Intl as any).ListFormat()
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

const buildDirectUrl = (path: string) =>
  new URL(path, 'https://developer.mozilla.org/en-US/docs/').toString();



const mdnHandler = async (
  client: Client,
  interaction: CommandInteraction
): Promise<unknown> => {
  const searchTerm: string = interaction.options.getString('query');
  const deferral = await interaction.deferReply({ ephemeral: true });
  try {
    const url = getSearchUrl(provider, searchTerm);
    const { error, json } = await fetch<SearchResponse>(url, 'json');

    if (error) {
      await interaction.editReply({
        content: invalidResponse,
      });
      return;
    }

    if (json.documents.length === 0) {
      await interaction.editReply({
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
        .setStyle('SECONDARY')
        .setCustomId(`mdn🤔${msgId}🤔cancel`)
    );

    await deferral;
    const int = (await interaction.editReply({
      content: 'Please pick 1 - 5 options below to display',
      components: [selectRow, buttonRow],
    })) as Message;

    const interactionCollector = int.createMessageComponentCollector<
      MessageComponentTypes.SELECT_MENU | MessageComponentTypes.BUTTON
    >({
      filter: item => item.user.id === interaction.user.id && item.customId.startsWith(`mdn🤔${msgId}`),
    });

    interactionCollector.once('collect', async (interaction:ButtonInteraction|SelectMenuInteraction) => {
      await interaction.deferUpdate();
      if (interaction.isButton()) {
        await int.delete();
        return;
      }
      const valueSet = new Set(interaction.values);
      const values = collection.filter((_, key) => valueSet.has(key));

      await interaction.editReply({
        content: `Displaying Results for ${list.format(values.map(({title}) => title))}`,
        components: []
      })

      interaction.channel.send({
        content: `Results for "${searchTerm}"`,
        embeds: values.map(({ title, summary, slug }) =>
          new MessageEmbed()
            .setTitle(`${maybeClippy()} ${title}`)
            .setDescription(summary.split('\n').map(item => item.trim()).join(' '))
            .setURL(buildDirectUrl(slug))
            .setColor('WHITE')
        ),
      });
    });

  } catch (error) {
    console.error(error);
    interaction.editReply(unknownError);
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
  return Math.random() <= 0.01 ? '<:clippy:865257202915082254>' : '🔗';
}
