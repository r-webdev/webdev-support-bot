import { Message } from 'discord.js';
import * as DOMParser from 'dom-parser';
import { Html5Entities as Entities } from 'html-entities';

import {
  createMarkdownLink,
  createDescription,
  createListEmbed,
  createMarkdownListItem,
  getChosenResult,
  attemptEdit,
  adjustTitleLength,
} from '../../utils/discordTools';
import * as errors from '../../utils/errors';
import { getSearchUrl, buildDirectUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

const provider = 'php';
const entities = new Entities();

const handlePHPQuery = async (msg: Message, searchTerm: string) => {
  try {
    const searchUrl = getSearchUrl(provider, searchTerm);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { error, text } = await useData(searchUrl, 'text');

    if (error) {
      msg.reply(errors.invalidResponse);
      return;
    }

    const parser = new DOMParser();
    const document = parser.parseFromString(text);

    // Check if we were directed directly to the result.
    let isDirect = document.getElementById('quickref_functions') === null;
    if (isDirect) {
      await msg.channel.send(buildDirectUrl(provider, searchTerm));
      return;
    }

    const results = document
      .getElementById('quickref_functions')
      .getElementsByTagName('li')
      .slice(0, 10);

    let preparedDescription = results.map((result, index) => {
      const link = result.firstChild;
      const { title, url } = extractMetadataFromResult(link);

      const item = createMarkdownListItem(
        index,
        createMarkdownLink(adjustTitleLength([`**${title}**`].join(' - ')), url)
      );

      return item;
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

    const result = await getChosenResult(sentMsg, msg, results);

    if (!result) {
      return;
    }

    const { url } = extractMetadataFromResult(result.firstChild);

    await attemptEdit(sentMsg, url, { embed: null });
  } catch (error) {
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
const escapeMarkdown = (text: string) => text.replace(/(\*|_|`|~|\\)/g, '\\$1');

export default handlePHPQuery;
