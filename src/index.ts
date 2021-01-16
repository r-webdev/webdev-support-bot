import * as Sentry from '@sentry/node';
import { Client, Message, MessageReaction, User } from 'discord.js';
import * as mongoose from 'mongoose';

import { detectVar as _detectVar } from './autorespond/code_parsing';
import { detectVagueQuestion } from './autorespond/justask';
import { limitFnByUser } from './cache';
import handleBundlephobiaQuery from './commands/bundlephobia';
import handleCanIUseQuery from './commands/caniuse';
import handleCodeRequest from './commands/code';
import handleComposerQuery from './commands/composer';
import handleDecayRequest from './commands/decay';
import handleFormattingRequest from './commands/formatting';
import handleGithubQuery from './commands/github';
import handleJQueryCommand from './commands/jquery';
import handleLeaderboardRequest from './commands/leaderboard';
import handleResetLockfileRequest from './commands/lockfile';
import handleMDNQuery from './commands/mdn';
import handleModuleRequest from './commands/modules';
import handleNPMQuery from './commands/npm';
import handlePHPQuery from './commands/php';
import handlePointsRequest from './commands/points';
import handleJobPostingRequest from './commands/post';
import handleVSCodeRequest from './commands/vscode';
import {
  DISCORD_TOKEN,
  IS_PROD,
  DUMMY_TOKEN,
  MONGO_URI,
  SERVER_ID,
  ENV,
  VAR_DETECT_LIMIT,
  JUST_ASK_DETECT_LIMIT,
} from './env';
import handleHelpfulRole, {
  allowedEmojis as helpfulRoleEmojis,
} from './helpful_role';
import pointDecaySystem from './helpful_role/point_decay';
import spamFilter from './spam_filter';
import handleSpam from './spam_filter/handler';
import handleThanks from './thanks';
import isThanksMessage from './thanks/checker';
import {
  generateCleanContent,
  stripMarkdownQuote,
} from './utils/content_format';
import { Provider } from './utils/discordTools';
import * as errors from './utils/errors';
import {
  providers,
  KEYWORD_REGEXP,
  HELP_KEYWORD,
  FORMATTING_KEYWORD,
  CODE_KEYWORD,
  VSCODE_KEYWORD,
  JOB_POSTING_KEYWORD,
  FORMATTING_KEYWORD_ALT,
  JQUERY_KEYWORD,
  POINTS_KEYWORD,
  LEADERBOARD_KEYWORD,
  DECAY_KEYWORD,
  MODULE_KEYWORD,
  LOCKFILE_KEYWORD,
} from './utils/urlTools';

if (IS_PROD) {
  Sentry.init({
    dsn:
      'https://9902d087a01f4d8883daad5d59d90736@o163592.ingest.sentry.io/5307626',
  });
}

// This date is used to check if the message's been created before the bot's started
export const startTime = new Date();

const client = new Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

const blacklistedServer = new Set([
  '264445053596991498', // Discord Bot List
  '448549361119395850', // some random bot test server
  '657145936207806465', // nazi stuff
]);

client.on('ready', () => {
  // eslint-disable-next-line no-console
  console.log(`Logged in as ${client.user.tag}!\nEnvironment: ${ENV}`);
});

client.once('ready', async () => {
  client.user.setActivity(`@${client.user.username} --help`);

  await Promise.all(
    client.guilds.cache
      .filter(guild => blacklistedServer.has(guild.id))
      .map(guild => guild.leave())
  );

  // eslint-disable-next-line no-console
  console.table(
    client.guilds.cache.map(({ name, id, joinedAt, memberCount }) => ({
      id,
      joinedAt: joinedAt.toLocaleDateString(),
      memberCount,
      name,
    }))
  );

  try {
    await client.user.setAvatar('./logo.png');
  } catch {}
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
  cleanContent.slice(keywordMap[provider].length + 2);

const help: { [key: string]: string } = Object.entries(providers).reduce(
  (carry, [provider, { help }]) => {
    carry[provider] = help;
    return carry;
  },
  {}
);

const isWebdevAndWebDesignServer = (msg: Message) =>
  msg.guild?.id === SERVER_ID || false;

const handleMessage = async (msg: Message) => {
  const cleanContent = generateCleanContent(msg);

  if (isWebdevAndWebDesignServer(msg)) {
    // Run the point decay system
    await pointDecaySystem(msg);
  }

  // Points command override due to passing flags
  if (
    isWebdevAndWebDesignServer(msg) &&
    cleanContent.startsWith(POINTS_KEYWORD)
  ) {
    return await handlePointsRequest(msg);
  }

  // Decay command override due to passing flags
  if (
    isWebdevAndWebDesignServer(msg) &&
    cleanContent.startsWith(DECAY_KEYWORD)
  ) {
    return await handleDecayRequest(msg);
  }

  // Pipe the message into the spam filter
  const spamMetadata = spamFilter(msg);

  if (spamMetadata) {
    await handleSpam(spamMetadata);
    return;
  }

  switch (cleanContent) {
    case MODULE_KEYWORD:
      return await handleModuleRequest(msg);
    case FORMATTING_KEYWORD:
    case FORMATTING_KEYWORD_ALT:
      return await handleFormattingRequest(msg);
    case CODE_KEYWORD:
      return await handleCodeRequest(msg);
    case VSCODE_KEYWORD:
      return await handleVSCodeRequest(msg);
    case JOB_POSTING_KEYWORD:
      return await handleJobPostingRequest(msg);
    case JQUERY_KEYWORD:
      return await handleJQueryCommand(msg);
    case LEADERBOARD_KEYWORD:
      return await handleLeaderboardRequest(msg);
    case LOCKFILE_KEYWORD:
      return handleResetLockfileRequest(msg);
    // case POINTS_KEYWORD:
    //   return await handlePointsRequest(msg);
    default:
      // todo: probably refactor this sooner or later
      const isGeneralHelpRequest =
        cleanContent.includes(HELP_KEYWORD) &&
        !!msg.mentions.users.find(
          ({ username }) => username === client.user.username
        );

      if (isGeneralHelpRequest) {
        return await msg.reply(
          [
            '\ntry one of these:',
            ...Object.values(help).map(str => `> ${str}`),
            'or',
            '> !formatting',
            '> !code',
          ].join('\n')
        );
      }

      const isCommandQuery =
        cleanContent.startsWith('!') && KEYWORD_REGEXP.test(cleanContent);

      // bail if no keyword was found
      if (!isCommandQuery) {
        return handleNonCommandMessages(msg);
      }

      const keyword = cleanContent.split(' ', 1)[0].slice(1);
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
          case keywordMap.php:
            return await handlePHPQuery(msg, searchTerm);
          default:
            throw new Error('classic "shouldnt be here" scenario');
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`${error.name}: ${error.message}`);
        await msg.reply(errors.unknownError);
      }
  }
};

const detectVar = limitFnByUser(_detectVar, {
  delay: VAR_DETECT_LIMIT,
  type: 'VAR_CHECK',
});

const detectJustAsk = limitFnByUser(detectVagueQuestion, {
  delay: JUST_ASK_DETECT_LIMIT,
  type: 'JUST_ASK',
});
const handleNonCommandMessages = async (msg: Message) => {
  const quoteLessContent = stripMarkdownQuote(msg.content);

  if (isWebdevAndWebDesignServer(msg) && isThanksMessage(quoteLessContent)) {
    handleThanks(msg);
  }
  await detectJustAsk(msg);
  await detectVar(msg);
};

const prepReaction = async (reaction: MessageReaction) => {
  // role id is "hardcoded" through env. in this version of the bot, only the
  // webdev and web_design server is supported
  if (reaction.message.guild.id !== SERVER_ID) {
    return;
  }

  const { me, partial } = reaction;

  if (me) {
    return;
  }

  return partial ? await reaction.fetch() : reaction;
};

const handleReactionAdd = async (reaction: MessageReaction, user: User) => {
  const prepared = await prepReaction(reaction);

  if (!prepared) {
    return;
  }

  const {
    emoji: { name },
  } = prepared;

  if (helpfulRoleEmojis.includes(name)) {
    await handleHelpfulRole(reaction, user);
  }
  // Add more cases if necessary
};

// Establish a connection with the database
export const dbConnect = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // eslint-disable-next-line no-console
    console.log('MongoDB connection established.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('mongoose.connect():', error);
  }
};

dbConnect();

client.on('message', handleMessage);
client.on('messageReactionAdd', handleReactionAdd);

try {
  client.login(IS_PROD ? DISCORD_TOKEN : DUMMY_TOKEN);
} catch {
  // eslint-disable-next-line no-console
  console.error('Boot Error: token invalid');
}
