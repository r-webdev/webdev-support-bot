/* eslint-disable unicorn/prefer-query-selector */
import { Message } from 'discord.js';

import delayedMessageAutoDeletion from '../../utils/delayedMessageAutoDeletion';
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
import * as errors from '../../utils/errors';
import { buildDirectUrl, getSearchUrl } from '../../utils/urlTools';
import useData from '../../utils/useData';

const provider = 'mdn';

interface SearchResponse {
  query: string;
  locale: string;
  page: number;
  pages: number;
  starts: number;
  end: number;
  next: string;
  previous: string | null;
  count: number;
  filter: Array<{
    name: string;
    slug: string;
    options: Array<{
      name: string;
      slug: string;
      count: number;
      active: boolean;
      urls: {
        active: string;
        inactive: string;
      };
    }>;
  }>;
  documents: Array<{
    title: string;
    slug: string;
    locale: string;
    excerpt: string;
  }>;
}

export const updatedQueryBuilder = (
  fetch: typeof useData = useData,
  waitForChosenResult: typeof getChosenResult = getChosenResult
) => async (msg: Message, searchTerm: string) => {
  try {
    const url = getSearchUrl(provider, searchTerm);
    const { error, json } = await fetch<SearchResponse>(url, 'json');
    if (error) {
      return msg.reply(errors.invalidResponse);
    }

    if (json.documents.length === 0) {
      const sentMsg = await msg.reply(errors.noResults(searchTerm));
      return delayedMessageAutoDeletion(sentMsg);
    }

    let preparedDescription = json.documents.map(
      ({ title, excerpt, slug }, index) =>
        createMarkdownListItem(
          index,
          createMarkdownLink(
            adjustTitleLength([`**${title}**`, excerpt].join(' - ')),
            buildDirectUrl(provider, slug)
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

    const sentMsg = await msg.channel.send(
      createListEmbed({
        description: createDescription(preparedDescription),
        footerText: `${json.documents.length} results found`,
        provider,
        searchTerm,
        url,
      })
    );

    const result = await waitForChosenResult(sentMsg, msg, json.documents);
    if (!result) {
      return;
    }

    const editableUrl = buildDirectUrl(provider, `/` + result.slug);
    await attemptEdit(sentMsg, editableUrl, { embed: null });
  } catch (error) {
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

export default updatedQueryBuilder();
