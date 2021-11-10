import * as bcd from '@mdn/browser-compat-data';
import {
  CompatStatement,
  SupportStatement,
} from '@mdn/browser-compat-data/types';
import { Message } from 'discord.js';

import { delayedMessageAutoDeletion } from '../../utils/delayedMessageAutoDeletion';
import {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  createDescription,
  createMarkdownListItem,
  getChosenResult,
  attemptEdit,
} from '../../utils/discordTools';
import { warning, yes, no } from '../../utils/emojis';
import * as errors from '../../utils/errors';
import { getExtendedInfoUrl, getData } from '../../utils/urlTools';
import useData from '../../utils/useData';
import { ExtendedCanIUseData } from './types';

const provider = 'caniuse';

const browserNameMap = Object.entries(bcd.browsers).reduce(
  (carry, [id, { name }]) => {
    carry[id] = name;

    return carry;
  },
  {}
);

export const buildCanIUseQueryHandler = (
  fetch: typeof getData = getData,
  fetchDetails: typeof useData = useData,
  waitForResponse: typeof getChosenResult = getChosenResult
) => async (msg: Message, searchTerm: string) => {
  try {
    const text = await fetch<string>({
      isInvalidData: text => text.length === 0,
      msg,
      provider,
      sanitizeData: text => text.replace('"', ''),
      searchTerm,
    });

    if (!text) {
      return;
    }

    const { error: extendedQueryError, json } = await fetchDetails<
      ExtendedCanIUseData[]
    >(getExtendedInfoUrl(provider, text));

    if (extendedQueryError) {
      await msg.reply(errors.invalidResponse);
      return;
    }

    let hashes = text.split(',').splice(0, 10);

    // ignore pure web-standard information as it lacks a path to MDN
    const filteredResults = json.filter((dataset, index) => {
      const isValid = !!dataset.path;

      if (!isValid) {
        // remove hash reference to preserve same indices with json
        hashes[index] = undefined;
      }

      return isValid;
    });

    hashes = hashes.filter(Boolean);
    const resultAmount = filteredResults.length;

    if (resultAmount === 0 || hashes.length === 0) {
      const sentMsg = await msg.reply(errors.noResults(searchTerm));

      delayedMessageAutoDeletion(sentMsg);
      return;
    }

    const firstTenResults = filteredResults
      .splice(0, 10)
      .map(({ title, path }, index) => {
        return {
          compatibilityMap: extractCompatibilityFromBCD(path),
          title,
          url: buildHashUrl(hashes[index]),
        };
      });

    const sentMsg = await msg.channel.send(
      createListEmbed({
        description: createDescription(
          firstTenResults.map(({ title, url }, index) =>
            createMarkdownListItem(index, createMarkdownLink(title, url))
          )
        ),
        footerText: `${resultAmount} results found`,
        provider,
        searchTerm,
        url: `https://caniuse.com/#search=${encodeURI(searchTerm)}`,
      })
    );

    const result = await waitForResponse<typeof firstTenResults[number]>(
      sentMsg,
      msg,
      firstTenResults
    );

    if (!result) {
      return;
    }

    const { title, url, compatibilityMap } = result;

    const fields = Object.entries(compatibilityMap.support).map(
      ([id, data]) => {
        const {
          isSupported,
          prefix,
          altName,
          flags: { isUserPreference, hasRuntimeFlag },
          isPartialImplementation,
        } = getFeatureMetadata(data);

        return {
          inline: true,
          name: browserNameMap[id],
          value: [
            isSupported,
            hasRuntimeFlag && `${warning} behind a flag`,
            isUserPreference && `${warning} user preference`,
            altName && `${warning} alt. name: ${altName}`,
            prefix && `${warning} use prefix: ${prefix}`,
            isPartialImplementation && `${warning} only partially supported`,
          ]
            .filter(Boolean)
            .join('\n'),
        };
      }
    );

    await attemptEdit(
      sentMsg,
      createEmbed({
        description: createMarkdownLink(
          'visit MDN for more information about this specific API',
          compatibilityMap.mdn_url
        ),
        fields,
        footerText:
          'This bot only considers the **latest stable version** of a browser.',
        provider,
        title: `CanIUse... ${title}`,
        url,
      })
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await msg.reply(errors.unknownError);
  }
};

/**
 *
 * @see https://github.com/mdn/browser-compat-data/blob/master/schemas/compat-data-schema.md#the-support_statement-object
 */
const getFeatureMetadata = (data: SupportStatement) => {
  const {
    version_added,
    flags,
    alternative_name,
    prefix,
    partial_implementation,
  } = Array.isArray(data) ? data[0] : data;

  const flagInformation = {
    hasRuntimeFlag: false,
    isUserPreference: false,
  };

  if (flags) {
    flagInformation.isUserPreference = !!flags.find(
      ({ type }) => type === 'preference'
    );

    flagInformation.hasRuntimeFlag = !!flags.find(
      ({ type }) => type === 'runtime_flag'
    );
  }

  // a feature may not be behind a flag to be supported in general
  const isSupported =
    version_added && !flagInformation.hasRuntimeFlag ? yes : no;

  return {
    altName: alternative_name && alternative_name,
    flags: flagInformation,
    isPartialImplementation: !!partial_implementation,
    isSupported,
    prefix: prefix && prefix,
  };
};

/**
 * Accesses browser-compat-data at the required level
 * and returns the __compat property
 *
 * @see https://github.com/mdn/browser-compat-data/blob/master/schemas/compat-data-schema.md#the-__compat-object
 *
 */
const extractCompatibilityFromBCD = (path: string): CompatStatement => {
  const parts = path.split('/');
  const finalProp = parts.pop().replace('.json', '');

  const compatObj = parts.reduce((carry, part) => {
    if (carry[part]) {
      return carry[part];
    }

    return bcd[part];
  }, {});

  if (compatObj[finalProp]) {
    return compatObj[finalProp].__compat;
  }

  if (finalProp.includes('-')) {
    const capitalizedProp = finalProp
      .split('-')
      .map(str => str.charAt(0).toUpperCase() + str.slice(1))
      .join('-');

    return compatObj[capitalizedProp].__compat;
  }

  throw new Error(`unknown path/finalProp: ${path} -> ${finalProp}`);
};

const buildHashUrl = (hash: string) => `https://caniuse.com/#feat=${hash}`;

export default buildCanIUseQueryHandler();
