import { Message } from 'discord.js';

import { getExtendedInfoUrl, getData } from '../../utils/urlTools';
import * as errors from '../../utils/errors';
import {
  createMarkdownLink,
  createListEmbed,
  createEmbed,
  createDescription,
  createMarkdownListItem,
  getChosenResult,
  attemptEdit,
} from '../../utils/discordTools';
import useData from '../../utils/useData';
import * as bcd from 'mdn-browser-compat-data';
import { warning, yes, no } from '../../utils/emojis';
import delayedMessageAutoDeletion from '../../utils/delayedMessageAutoDeletion';
import { ExtendedCanIUseData } from './types';
import {
  CompatStatement,
  SupportStatement,
} from 'mdn-browser-compat-data/types';

const provider = 'caniuse';

const browserNameMap = Object.entries(bcd.browsers).reduce(
  (carry, [id, { name }]) => {
    carry[id] = name;

    return carry;
  },
  {}
);

const handleCanIUseQuery = async (msg: Message, searchTerm: string) => {
  try {
    const text = await getData<string>({
      msg,
      searchTerm,
      provider,
      sanitizeData: (text) => text.replace('"', ''),
      isInvalidData: (text) => text.length === 0,
    });

    if (!text) {
      return;
    }

    const { error: extendedQueryError, json } = await useData<
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
          title,
          url: buildHashUrl(hashes[index]),
          compatibilityMap: extractCompatibilityFromBCD(path),
        };
      });

    const sentMsg = await msg.channel.send(
      createListEmbed({
        url: `https://caniuse.com/#search=${encodeURI(searchTerm)}`,
        footerText: `${resultAmount} results found`,
        provider,
        searchTerm,
        description: createDescription(
          firstTenResults.map(({ title, url }, index) =>
            createMarkdownListItem(index, createMarkdownLink(title, url))
          )
        ),
      })
    );

    const result = await getChosenResult<typeof firstTenResults[number]>(
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
          name: browserNameMap[id],
          inline: true,
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
        provider,
        url,
        title: `CanIUse... ${title}`,
        footerText:
          'This bot only considers the **latest stable version** of a browser.',
        description: createMarkdownLink(
          'visit MDN for more information about this specific API',
          compatibilityMap.mdn_url
        ),
        fields,
      })
    );
  } catch (error) {
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
    isUserPreference: false,
    hasRuntimeFlag: false,
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
    isSupported,
    flags: flagInformation,
    altName: alternative_name && alternative_name,
    prefix: prefix && prefix,
    isPartialImplementation: !!partial_implementation,
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
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
      .join('-');

    return compatObj[capitalizedProp].__compat;
  }

  throw new Error(`unknown path/finalProp: ${path} -> ${finalProp}`);
};

const buildHashUrl = (hash: string) => `https://caniuse.com/#feat=${hash}`;

export default handleCanIUseQuery;
