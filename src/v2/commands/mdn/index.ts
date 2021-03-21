/* eslint-disable unicorn/prefer-query-selector */
import type {
  Client,
  Interaction,
  Message,
  MessageEmbed,
  TextChannel,
} from 'discord.js';
import { create } from 'ts-node';
import { URL } from 'url';

import {
  ApplicationCommandOptionType,
  InteractionResponseType,
} from '../../../enums';
import {
  createInteractionResponse,
  editOriginalInteractionResponse,
  registerCommand,
} from '../../interactions';
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

const getTextMessageFromMessageObj = async (
  client: Client,
  guildId: string,
  messageObject: Record<string, string>
): Promise<Message> => {
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(
    messageObject.channel_id
  ) as TextChannel;
  return channel.messages.fetch(messageObject.id);
};

const mdnHandler = async (
  client: Client,
  interaction: Interaction
): Promise<unknown> => {
  const searchTerm: string = interaction.data.options[0].value;
  try {
    const url = getSearchUrl(provider, searchTerm);
    const { error, json } = await fetch<SearchResponse>(url, 'json');
    if (error) {
      return await createInteractionResponse(client, interaction, {
        data: {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: invalidResponse,
            flags: 64,
          },
        },
      });
    }

    if (json.documents.length === 0) {
      return await createInteractionResponse(client, interaction, {
        data: {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: noResults(searchTerm),
            flags: 64,
          },
        },
      });
    }

    let preparedDescription = json.documents.map(
      ({ title, summary, slug }, index) =>
        createMarkdownListItem(
          index,
          createMarkdownLink(
            adjustTitleLength([`**${title}**`, summary].join(' - ')),
            buildDirectUrl(slug)
          )
        )
    );

    const expectedLength = preparedDescription.reduce(
      (sum, item) => sum + item.length,
      0
    );

    if (expectedLength + BASE_DESCRIPTION.length + 10 * '\n'.length > 2048) {
      preparedDescription = preparedDescription.map(string => {
        // split at markdown link ending
        const [title, ...rest] = string.split('...]');

        // split title on title - excerpt glue
        // concat with rest
        // fix broken markdown link ending
        return [title.split(' - ')[0], rest.join('')].join(']');
      });
    }

    await createInteractionResponse(client, interaction, {
      data: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '',
          embeds: [
            createListEmbed({
              description: createDescription(preparedDescription),
              footerText: `${json.documents.length} results found`,
              provider,
              searchTerm,
              url,
            }).embed as MessageEmbed,
          ],
        },
      },
    });

    const interactionMessageObj = await editOriginalInteractionResponse(
      client,
      interaction,
      {
        data: {},
      }
    );

    const sentMsg = await getTextMessageFromMessageObj(
      client,
      interaction.guild_id,
      interactionMessageObj as Record<string, string>
    );

    const result = await waitForChosenResult(
      sentMsg,
      { author: { id: interaction.member.user.id } },
      json.documents
    );
    if (!result) {
      return;
    }

    const editableUrl = buildDirectUrl(result.slug);
    await attemptEdit(sentMsg, editableUrl, { embed: null });
  } catch {
    try {
      await createInteractionResponse(client, interaction, {
        data: {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: unknownError,
          },
        },
      });
    } catch {
      editOriginalInteractionResponse(client, interaction, {
        data: {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: unknownError,
          },
        },
      });
    }
  }
};

registerCommand({
  name: 'mdn',
  description: 'search mdn',
  handler: async (client, interaction): Promise<void> => {
    await mdnHandler(client, interaction);
  },
  options: [
    {
      name: 'query',
      description: 'query',
      type: ApplicationCommandOptionType.STRING,
      required: true,
    },
  ],
});
