require('dotenv').config();
import { Client, Message } from 'discord.js';
import {
  providers,
  KEYWORD_REGEXP,
  HELP_KEYWORD,
  FORMATTING_KEYWORD,
  CODE_KEYWORD,
} from './utils/urlTools';

import * as errors from './utils/errors';

// Spam filtering module
import spamFilter from './spam_filter';
import handleSpam from './spam_filter/handler';

// commands begin here
import handleMDNQuery from './commands/mdn';
import handleNPMQuery from './commands/npm';
import handleComposerQuery from './commands/composer';
import handleCanIUseQuery from './commands/caniuse';
import handleGithubQuery from './commands/github';
import handleBundlephobiaQuery from './commands/bundlephobia';
import handleFormattingRequest from './commands/formatting';
import { Provider } from './utils/discordTools';
import handleCodeRequest from './commands/code';

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.once('ready', async () => {
  client.user.setActivity(`@${client.user.username} --help`);

  try {
    await client.user.setAvatar('./logo.png');
    // eslint-disable-next-line no-empty
  } catch (error) {}
});

// { mdn: 'mdn', /* etc */ }
const keywordMap = Object.keys(providers).reduce<{ [key: string]: Provider }>(
  (carry, keyword: Provider) => {
    carry[keyword] = keyword;
    return carry;
  },
  {}
);

const trimCleanContent = (provider: Provider, cleanContent: string) =>
  cleanContent.substr(keywordMap[provider].length + 2);

const linebreakPattern = /\n/gim;

const help: { [key: string]: string } = Object.entries(providers).reduce(
  (carry, [provider, { help }]) => {
    carry[provider] = help;
    return carry;
  },
  {}
);

const handleMessage = async (msg: Message) => {
  const cleanContent = msg.cleanContent
    .replace(linebreakPattern, ' ')
    .toLowerCase();

  // Pipe the message into the spam filter
  const spamMetadata = spamFilter(msg);

  if (spamMetadata) {
    await handleSpam(spamMetadata);
    return;
  }

  if (cleanContent === FORMATTING_KEYWORD) {
    return await handleFormattingRequest(msg);
  }

  switch (cleanContent) {
    case FORMATTING_KEYWORD:
      return await handleFormattingRequest(msg);
    case CODE_KEYWORD:
      return await handleCodeRequest(msg);
    default:
      // todo: probably refactor this sooner or later
      const isGeneralHelpRequest =
        cleanContent.includes(HELP_KEYWORD) &&
        !!msg.mentions.users.find(
          ({ username }) => username === client.user.username
        );

      if (isGeneralHelpRequest) {
        const prefix = 'try one of these:\n';

        return await msg.reply(prefix + Object.values(help).join('\n'));
      }

      const isCommandQuery =
        cleanContent.startsWith('!') && KEYWORD_REGEXP.test(cleanContent);

      // bail if no keyword was found
      if (!isCommandQuery) {
        return;
      }

      const keyword = cleanContent.split(' ', 1)[0].substr(1);
      const searchTerm = trimCleanContent(keywordMap[keyword], cleanContent);

      const isSpecificHelpRequest =
        searchTerm.length === 0 || searchTerm === HELP_KEYWORD;

      // empty query or specific call for help
      if (isSpecificHelpRequest) {
        await msg.reply(help[keyword]);
        return;
      }

      try {
        switch (keyword) {
          case keywordMap.mdn:
            return await handleMDNQuery(msg, searchTerm);
          case keywordMap.caniuse:
            return await handleCanIUseQuery(msg, searchTerm);
          case keywordMap.npm:
            return await handleNPMQuery(msg, searchTerm);
          case keywordMap.composer:
            return await handleComposerQuery(msg, searchTerm);
          case keywordMap.github:
            return await handleGithubQuery(msg, searchTerm);
          case keywordMap.bundlephobia:
            return await handleBundlephobiaQuery(msg, searchTerm);
          default:
            throw new Error('classic "shouldnt be here" scenario');
        }
      } catch (error) {
        console.error(`${error.name}: ${error.message}`);
        await msg.reply(errors.unknownError);
      }
  }
};

client.on('message', handleMessage);

try {
  client.login(
    process.env.NODE_ENV !== 'production'
      ? process.env.DUMMY_TOKEN
      : process.env.DISCORD_TOKEN
  );
} catch (error) {
  console.error('Boot Error: token invalid');
}
