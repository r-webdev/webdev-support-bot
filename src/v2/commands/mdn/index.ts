/* eslint-disable unicorn/prefer-query-selector */
import type { Client, MessageEmbed } from 'discord.js';
import { URL } from 'url';

import { ApplicationCommandOptionType } from '../../../enums';
import type { Interaction } from '../../interactions';
import { registerCommand } from '../../interactions';
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

const mdnHandler = async (
  client: Client,
  interaction: Interaction
): Promise<unknown> => {
  const searchTerm: string = interaction.data.options[0].value;
  try {
    const url = getSearchUrl(provider, searchTerm);
    const { error, json } = await fetch<SearchResponse>(url, 'json');
    if (error) {
      return await interaction.reply({
        content: invalidResponse,
        flags: 64,
      });
    }

    if (json.documents.length === 0) {
      return await interaction.reply({
        content: noResults(searchTerm),
        flags: 64,
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

    const sentMsg = await interaction.reply(
      createListEmbed({
        description: createDescription(preparedDescription),
        footerText: `${json.documents.length} results found`,
        provider,
        searchTerm,
        url,
      }).embed as MessageEmbed
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
    interaction.reply(unknownError);
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
