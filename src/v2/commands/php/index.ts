/* eslint-disable unicorn/prefer-query-selector */
import type { Client, Message, MessageEmbed } from 'discord.js';
import type { Node } from 'dom-parser';
import DOMParser from 'dom-parser';
import { Html5Entities as Entities } from 'html-entities';

import { ApplicationCommandOptionType } from '../../../enums';
import { invalidResponse, unknownError } from '../../../v2/utils/errors';
import type { Interaction } from '../../interactions';
import { registerCommand } from '../../interactions';
import {
  adjustTitleLength,
  attemptEdit,
  createDescription,
  createListEmbed,
  createMarkdownLink,
  createMarkdownListItem,
  getChosenResult,
} from '../../utils/discordTools';
import {} from '../../utils/errors';
import { buildDirectUrl, getSearchUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

const provider = 'php';
const entities = new Entities();

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

  const title = escapeMarkdown(entities.decode(titleElement));

  const url = buildDirectUrl(provider, result.getAttribute('href'));

  return {
    title,
    url,
  };
};

/**
 * Escapes *, _, `, ~, \
 */
const escapeMarkdown = (text: string) => text.replace(/([*\\_`~])/gu, '\\$1');

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
const waitForResult = getChosenResult;

const handler = async (client: Client, interaction: Interaction) => {
  const searchTerm = interaction.data.options[0].value;

  try {
    const { error, text, searchUrl } = await makeRequest(searchTerm);
    if (error) {
      await interaction.reply(invalidResponse);
      return;
    }

    const { isDirect, results } = parseText(text);
    if (isDirect) {
      await interaction.reply(buildDirectUrl(provider, searchTerm));
      return;
    }

    const preparedDescription = results.map((result, index) => {
      const link = result.firstChild;
      const { title, url } = metadataExtractor(link);

      return createMarkdownListItem(
        index,
        createMarkdownLink(adjustTitleLength([`**${title}**`].join(' - ')), url)
      );
    });

    const sentMsg = await interaction.reply(
      createListEmbed({
        description: createDescription(preparedDescription),
        footerText: '',
        provider,
        searchTerm,
        url: searchUrl,
      }).embed as MessageEmbed
    );

    const result = await waitForResult(
      sentMsg,
      { author: { id: interaction.member.user.id } },
      results
    );

    if (!result) {
      return;
    }

    const { url } = metadataExtractor(result.firstChild);

    await attemptEdit(sentMsg, url, { embed: null });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await interaction.reply(unknownError);
  }
};

registerCommand({
  name: 'php',
  description: 'search and link something from php.net',
  handler,
  options: [
    {
      name: 'query',
      description: 'The search query for php',
      type: ApplicationCommandOptionType.STRING,
      required: true,
    },
  ],
});
