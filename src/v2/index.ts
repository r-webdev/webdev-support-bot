import { init } from '@sentry/node';
import type { Message } from 'discord.js';
import { Client, MessageReaction, User } from 'discord.js';
import { connect } from 'mongoose';

import {
  DISCORD_TOKEN,
  IS_PROD,
  DUMMY_TOKEN,
  MONGO_URI,
  SERVER_ID,
  ENV,
  VAR_DETECT_LIMIT,
  JUST_ASK_DETECT_LIMIT,
} from '../env';
import { detectVar } from './autorespond/code_parsing';
import { detectVagueQuestion } from './autorespond/justask';
import { limitFnByUser } from './cache';
import { initCommands } from './commands';
import { createHandleInteractionWebhook } from './interactions';
import handleThanks from './thanks';
import isThanksMessage from './thanks/checker';
import {
  generateCleanContent,
  stripMarkdownQuote,
} from './utils/content_format';

if (IS_PROD) {
  init({
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

client.once(
  'ready',
  async (): Promise<void> => {
    void initCommands(client);

    client.ws.on('INTERACTION_CREATE', createHandleInteractionWebhook(client));

    void client.user.setActivity(`@${client.user.username} --help`);

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
  }
);

const detectVarLimited = limitFnByUser(detectVar, {
  delay: VAR_DETECT_LIMIT,
  type: 'VAR_CHECK',
});

const detectJustAsk = limitFnByUser(detectVagueQuestion, {
  delay: JUST_ASK_DETECT_LIMIT,
  type: 'JUST_ASK',
});

const isWebdevAndWebDesignServer = (msg: Message) =>
  msg.guild?.id === SERVER_ID || false;

client.on('message', msg => {
  if (msg.author.bot) {
    return;
  }

  if (msg.channel.type === 'text' && msg.guild) {
    handleNonCommandGuildMessages(msg);
  }
});

const handleNonCommandGuildMessages = async (msg: Message) => {
  const quoteLessContent = stripMarkdownQuote(msg.content);

  if (isWebdevAndWebDesignServer(msg) && isThanksMessage(quoteLessContent)) {
    handleThanks(msg);
  }
  await detectJustAsk(msg);
  await detectVarLimited(msg);
};

// Establish a connection with the database
export const dbConnect = async (): Promise<void> => {
  try {
    await connect(MONGO_URI, {
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

try {
  client.login(IS_PROD ? DISCORD_TOKEN : DUMMY_TOKEN);
} catch {
  // eslint-disable-next-line no-console
  console.error('Boot Error: token invalid');
}
