import { getSearchUrl, buildDirectUrl } from '../../utils/urlTools';
import { Html5Entities as Entities } from 'html-entities';
import * as DOMParser from 'dom-parser';
import * as errors from '../../utils/errors';
import {
  createMarkdownLink,
  createDescription,
  createListEmbed,
  createMarkdownListItem,
  getChosenResult,
  attemptEdit,
  adjustTitleLength,
} from '../../utils/discordTools';
import useData from '../../utils/useData';
import { Message } from 'discord.js';

const provider = 'php';
const entities = new Entities();

const handlePHPQuery = async (msg: Message, searchTerm: string) => {
  try {
    const searchUrl = getSearchUrl(provider, searchTerm);
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
    let expectedLength = 0;

    let preparedDescription = results.map((result, index) => {
      const link = result.firstChild;
      const { title, url } = extractMetadataFromResult(link);

      const item = createMarkdownListItem(
        index,
        createMarkdownLink(adjustTitleLength([`**${title}**`].join(' - ')), url)
      );

      expectedLength += item.length;

      return item;
    });

    const sentMsg = await msg.channel.send(
      createListEmbed({
        provider,
        searchTerm,
        url: searchUrl,
        footerText: '',
        description: createDescription(preparedDescription),
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

const sanitizeExcerpt = (excerpt: string) => {
  let sanitized = excerpt;

  if (
    sanitized.includes(')') &&
    sanitized.indexOf(')') < sanitized.indexOf('(')
  ) {
    sanitized = sanitized.replace(')', '');
  }

  return sanitized.replace(/\[|\]/g, '');
};

/**
 * Escapes *, _, `, ~, \
 */
const escapeMarkdown = (text: string) => text.replace(/(\*|_|`|~|\\)/g, '\\$1');

export default handlePHPQuery;
