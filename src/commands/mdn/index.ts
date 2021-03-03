import { Message } from 'discord.js';
import { Html5Entities as Entities } from 'html-entities';

import { delayedMessageAutoDeletion } from '../../utils/delayedMessageAutoDeletion';
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

type MDNResult = {
  archived: boolean;
  locale: 'en-us';
  mdn_url: string;
  popularity: number;
  score: number;
  slug: string;
  summary: string;
  title: string;
  highlight: {
    body: string[];
    title: string[];
  };
};

interface ParserResult {
  results: MDNResult[];
  isEmpty: boolean;
  meta: string;
}

type MDNResponse = {
  documents: MDNResult[];
  suggestions: [];
  metadata: {
    took_ms: number;
    total: {
      value: number;
      relation: 'eq';
    };
    size: number;
    page: number;
  };
};

const defaultParser = (json: MDNResponse): ParserResult => {
  if (json.documents.length === 0) {
    return {
      isEmpty: true,
      meta: '',
      results: [],
    };
  }

  return {
    isEmpty: false,
    meta: `Found ${json.metadata.total.value} results.`,
    results: json.documents,
  };
};

/**
 *
 * @param {any} result [document.parseFromString return type]
 */
const extractMetadataFromResult = (result: MDNResult) => {
  const title = result.title;
  const url = buildDirectUrl(provider, result.mdn_url);
  const excerpt = sanitizeExcerpt(
    escapeMarkdown(entities.decode(result.summary))
  );

  return {
    excerpt,
    title,
    url,
  };
};

/**
 * Poor man's dependency injection without introducing classes, just use closures
 * and higher order functions instead. Also provides a default so we don't have
 * to actual do it ourselves, just for unit testing purposes.
 */
export const queryBuilder = (
  mdnParser: typeof defaultParser = defaultParser,
  metaDataExtraction: typeof extractMetadataFromResult = extractMetadataFromResult,
  waitForChosenResult: typeof getChosenResult = getChosenResult
) => async (msg: Message, searchTerm: string) => {
  try {
    const searchUrl = getSearchUrl(provider, searchTerm);
    const { error, json } = await useData<MDNResponse>(searchUrl);

    if (error) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    const { results, isEmpty, meta } = mdnParser(json);

    if (isEmpty) {
      const sentMsg = await msg.reply(errors.noResults(searchTerm));

      delayedMessageAutoDeletion(sentMsg);
      return;
    }

    let expectedLength = 0;

    let preparedDescription = results.map((result, index) => {
      const { title, url, excerpt } = metaDataExtraction(result);

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

    const result = await waitForChosenResult(sentMsg, msg, results);

    if (!result) {
      return;
    }

    const { url } = metaDataExtraction(result);

    await attemptEdit(sentMsg, url, { embed: null });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

const sanitizeExcerpt = (excerpt: string) => {
  let sanitized = excerpt;

  if (
    sanitized.includes(')') &&
    sanitized.indexOf(')') < sanitized.indexOf('(')
  ) {
    sanitized = sanitized.replace(')', '');
  }

  return sanitized.replace(/\[]/g, '');
};

/**
 * Escapes *, _, `, ~, \
 */
const escapeMarkdown = (text: string) => text.replace(/([*\\_`~])/g, '\\$1');

export default queryBuilder();
