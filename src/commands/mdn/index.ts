import { Message } from 'discord.js';
import * as DOMParser from 'dom-parser';
import { Html5Entities as Entities } from 'html-entities';

import delayedMessageAutoDeletion from '../../utils/delayedMessageAutoDeletion';
import {
  createMarkdownLink,
  createDescription,
  createListEmbed,
  createMarkdownListItem,
  getChosenResult,
  attemptEdit,
  adjustTitleLength,
  BASE_DESCRIPTION,
} from '../../utils/discordTools';
import * as errors from '../../utils/errors';
import { getSearchUrl, buildDirectUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

const provider = 'mdn';
const entities = new Entities();

const handleMDNQuery = async (msg: Message, searchTerm: string) => {
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

    // meta provides information about the amount of results found
    const meta = document.getElementsByClassName('result-meta')[0].textContent;
    if (meta.startsWith('0 documents found')) {
      const sentMsg = await msg.reply(errors.noResults(searchTerm));

      delayedMessageAutoDeletion(sentMsg);
      return;
    }

    const results = document.getElementsByClassName('result');

    let expectedLength = 0;

    let preparedDescription = results.map((result, index) => {
      const { title, url, excerpt } = extractMetadataFromResult(result);

      const item = createMarkdownListItem(
        index,
        createMarkdownLink(
          adjustTitleLength([`**${title}**`, excerpt].join(' - ')),
          url
        )
      );

      expectedLength += item.length;

      return item;
    });

    // remove excerpt if its forseeable to go over embed.description Discord cap
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

    const sentMsg = await msg.channel.send(
      createListEmbed({
        description: createDescription(preparedDescription),
        footerText: meta.split('for')[0],
        provider,
        searchTerm,
        url: searchUrl,
      })
    );

    const result = await getChosenResult(sentMsg, msg, results);

    if (!result) {
      return;
    }

    const { url } = extractMetadataFromResult(result);

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
  const titleElement = result.getElementsByClassName('result-title')[0];
  const excerptElement = result.getElementsByClassName('result-excerpt')[0];

  const title = escapeMarkdown(entities.decode(titleElement.textContent));
  const url = buildDirectUrl(provider, titleElement.getAttribute('href'));

  const excerpt = sanitizeExcerpt(
    escapeMarkdown(entities.decode(excerptElement.textContent))
  );

  return {
    excerpt,
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

export default handleMDNQuery;
