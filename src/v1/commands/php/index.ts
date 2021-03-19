/* eslint-disable unicorn/prefer-query-selector */
import { Message } from 'discord.js';
import * as DOMParser from 'dom-parser';
import { Html5Entities as Entities } from 'html-entities';

import {
  adjustTitleLength,
  attemptEdit,
  createDescription,
  createListEmbed,
  createMarkdownLink,
  createMarkdownListItem,
  getChosenResult,
} from '../../utils/discordTools';
import * as errors from '../../utils/errors';
import { buildDirectUrl, getSearchUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

const provider = 'php';
const entities = new Entities();

interface ParseResult {
  isDirect: boolean;
  results: DOMParser.Node[];
}

const textParser = (text: string): ParseResult => {
  const parser = new DOMParser();
  const document = parser.parseFromString(text);

  // Check if we were directed directly to the result.
  let isDirect = document.getElementById('quickref_functions') === null;
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

export const buildPHPQueryHandler = (
  makeRequest: typeof requester = requester,
  parseText: typeof textParser = textParser,
  metadataExtractor: typeof extractMetadataFromResult = extractMetadataFromResult,
  waitForResult: typeof getChosenResult = getChosenResult
) => async (msg: Message, searchTerm: string) => {
  try {
    const { error, text, searchUrl } = await makeRequest(searchTerm);
    if (error) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    const { isDirect, results } = parseText(text);
    if (isDirect) {
      await msg.channel.send(buildDirectUrl(provider, searchTerm));
      return;
    }

    let preparedDescription = results.map((result, index) => {
      const link = result.firstChild;
      const { title, url } = metadataExtractor(link);

      return createMarkdownListItem(
        index,
        createMarkdownLink(adjustTitleLength([`**${title}**`].join(' - ')), url)
      );
    });

    const sentMsg = await msg.channel.send(
      createListEmbed({
        description: createDescription(preparedDescription),
        footerText: '',
        provider,
        searchTerm,
        url: searchUrl,
      })
    );

    const result = await waitForResult(sentMsg, msg, results);

    if (!result) {
      return;
    }

    const { url } = metadataExtractor(result.firstChild);

    await attemptEdit(sentMsg, url, { embed: null });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

/**
 *
 * @param {any} result [document.parseFromString return type]
 */
const extractMetadataFromResult = (result: any) => {
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
const escapeMarkdown = (text: string) => text.replace(/([*\\_`~])/g, '\\$1');

export default buildPHPQueryHandler();
