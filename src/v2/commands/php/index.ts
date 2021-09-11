/* eslint-disable unicorn/prefer-query-selector */
import type {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Message,
  SelectMenuInteraction
} from 'discord.js';
import  {
  MessageButton,
  MessageActionRow,
  MessageSelectMenu,
} from 'discord.js';
import type { Node } from 'dom-parser';
import DOMParser from 'dom-parser';
import { decode } from 'html-entities';

import type { CommandDataWithHandler } from '../../../types';
import { invalidResponse, unknownError } from '../../../v2/utils/errors';
import { clampLength, clampLengthMiddle } from '../../utils/clampStr';
import { buildDirectUrl, getSearchUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

const provider = 'php';

type ParseResult = {
  isDirect: boolean;
  results: DOMParser.Node[];
};

/**
 *
 * @param {any} result [document.parseFromString return type]
 */
const extractMetadataFromResult = (result: Node) => {
  const titleElement = result.textContent;

  const title = decode(titleElement);

  const url = buildDirectUrl(provider, result.getAttribute('href'));

  return {
    title,
    url,
  };
};

const textParser = (text: string): ParseResult => {
  const parser = new DOMParser();
  const document = parser.parseFromString(text);

  // Check if we were directed directly to the result.
  const isDirect = document.getElementById('quickref_functions') === null;
  if (isDirect) {
    return {
      isDirect,
      results: [],
    };
  }

  const results = document
    .getElementById('quickref_functions')
    .getElementsByTagName('li')
    .slice(0, 10);

  return {
    isDirect,
    results,
  };
};

const requester = async (
  searchTerm: string
): Promise<{ error: boolean; text: string; searchUrl: string }> => {
  const searchUrl = getSearchUrl(provider, searchTerm);
  const response = await useData(searchUrl, 'text');
  return {
    ...response,
    searchUrl,
  };
};

const makeRequest = requester;
const parseText = textParser;
const metadataExtractor = extractMetadataFromResult;

const handler = async (client: Client, interaction: CommandInteraction): Promise<void> => {
  const searchTerm = interaction.options.getString('query');
  const defer = interaction.deferReply()
  try {
    const { error, text, searchUrl } = await makeRequest(searchTerm);
    if (error) {
      await defer
      await interaction.editReply(invalidResponse);
      return;
    }

    const { isDirect, results } = parseText(text);
    if (isDirect) {
      await defer
      await interaction.editReply(buildDirectUrl(provider, searchTerm));
      return;
    }


    const msgId = Math.random().toString(16)

    const selectRow = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
        .setCustomId(`php🤔${msgId}🤔select`)
        .addOptions(
          results.map(({ firstChild: link }, index) => {
            const { title, url } = metadataExtractor(link);

            return {
              label: clampLengthMiddle(title, 25),
              description: clampLength(url, 50),
              value: String(index),
            }
          })
        )
      )


      const buttonRow = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel('Cancel')
          .setStyle('DANGER')
          .setCustomId(`mdn🤔${msgId}🤔cancel`)
      );

      await defer
      const int = (await interaction.editReply({
        content: 'Please pick 1 - 5 options below to display',
        components: [selectRow, buttonRow],
      })) as Message;

      const interactionCollector = int.createMessageComponentCollector<SelectMenuInteraction | ButtonInteraction>({
      filter: item => item.user.id === interaction.user.id && item.customId.startsWith(`php🤔${msgId}`),
    });

    interactionCollector.once('collect', async interaction => {
      await interaction.deferUpdate();
      if (interaction.isButton()) {
        await int.delete();
        return;
      }
      const [result] = interaction.values


      await interaction.editReply({
        components: [],
        content: buildDirectUrl(provider, result)
      });
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await interaction.reply(unknownError);
  }
};

export const phpCommand : CommandDataWithHandler = {
  name: 'php',
  description: 'search and link something from php.net',
  handler,
  options: [
    {
      name: 'query',
      description: 'The search query for php',
      type: 'STRING',
      required: true,
    },
  ],
};
