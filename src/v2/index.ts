import { init } from '@sentry/node';
import type { Message } from 'discord.js';
import { Client, Intents } from 'discord.js';
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
import { registerCommands } from './commands';
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
console.log(process.version)
const alreadyVoted = new Set()

// This date is used to check if the message's been created before the bot's started
export const startTime = new Date();

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    // Intents.FLAGS.GUILD_MEMBERS, // Privileged Intent
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    // Intents.FLAGS.GUILD_PRESENCES, // Privileged Intent
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
  ]
});

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
    registerCommands(client)
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

client.on('messageCreate', msg => {
  if (msg.author.bot) {
    return;
  }

  if (['GUILD_TEXT', 'GUILD_PRIVATE_THREAD','GUILD_PUBLIC_THREAD'].includes(msg.channel.type) && msg.guild) {
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
