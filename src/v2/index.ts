import { init } from '@sentry/node';
import type { Message } from 'discord.js';
import { Client, Intents } from 'discord.js';
import mongoose from 'mongoose';

import {
  DISCORD_TOKEN,
  IS_PROD,
  DUMMY_TOKEN,
  MONGO_URI,
  SERVER_ID,
  ENV,
  VAR_DETECT_LIMIT,
  JUST_ASK_DETECT_LIMIT,
} from '../env.js';
import { detectVar } from './autorespond/code_parsing/index.js';
import { handleDeprecatedCommands } from './autorespond/deprecatedCommands.js';
import { detectDeprecatedHTML } from './autorespond/html_parsing/index.js';
import { detectVagueQuestion } from './autorespond/justask.js';
import isThanksMessage from './autorespond/thanks/checker.js';
import {
  handleThanks,
  attachUndoThanksListener,
} from './autorespond/thanks/index.js';
import {
  attachThreadClose,
  attachThreadThanksHandler,
} from './autorespond/thanks/threadThanks.js';
import { limitFnByUser } from './cache/index.js';
import { registerCommands } from './commands/index.js';
import pointDecaySystem, { loadLastDecayFromDB } from './helpful_role/point_decay.js';
import { registerMessageContextMenu } from './message_context/index.js';
import { registerUserContextMenu } from './user_context/index.js';
import { asyncCatch } from './utils/asyncCatch.js';
import { stripMarkdownQuote } from './utils/content_format.js';

const NON_COMMAND_MSG_TYPES = new Set([
  'GUILD_TEXT',
  'GUILD_PRIVATE_THREAD',
  'GUILD_PUBLIC_THREAD',
]);

if (IS_PROD) {
  init({
    dsn: 'https://9902d087a01f4d8883daad5d59d90736@o163592.ingest.sentry.io/5307626',
  });
}

// This date is used to check if the message's been created before the bot's started
export const startTime = new Date();
loadLastDecayFromDB()

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS, // Privileged Intent
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_INVITES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_PRESENCES, // Privileged Intent
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
  ],
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

client.once('ready', async (): Promise<void> => {
  pointDecaySystem({
    guild: client.guilds.resolve(SERVER_ID)
  })
  registerCommands(client);
  registerUserContextMenu(client);
  registerMessageContextMenu(client);
  attachUndoThanksListener(client);
  attachThreadThanksHandler(client);
  attachThreadClose(client);

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
});

const detectVarLimited = limitFnByUser(detectVar, {
  delay: VAR_DETECT_LIMIT,
  type: 'VAR_CHECK',
});

const detectHTMLLimited = limitFnByUser(detectDeprecatedHTML, {
  delay: VAR_DETECT_LIMIT,
  type: 'DEP_HTML_CHECK',
});

const detectJustAsk = limitFnByUser(detectVagueQuestion, {
  delay: JUST_ASK_DETECT_LIMIT,
  type: 'JUST_ASK',
});

const detectDeprecatedCommands = limitFnByUser(handleDeprecatedCommands, {
  type: 'DEPRECATED_COMMANDS',
  delay: VAR_DETECT_LIMIT, // gonna reuse this as its just a temp measure
});

const isWebdevAndWebDesignServer = (msg: Message) =>
  msg.guild?.id === SERVER_ID || false;

client.on('messageCreate', msg => {
  if (msg.author.bot) {
    return;
  }

  if (NON_COMMAND_MSG_TYPES.has(msg.channel.type) && msg.guild) {
    handleNonCommandGuildMessages(msg);
  }
});

const handleNonCommandGuildMessages = async (msg: Message) => {
  const quoteLessContent = stripMarkdownQuote(msg.content);
  if (msg.author.bot) {
    return;
  }
  if (isWebdevAndWebDesignServer(msg) && isThanksMessage(quoteLessContent)) {
    handleThanks(msg);
  }
  await detectDeprecatedCommands(msg);
  await detectJustAsk(msg);
  await detectVarLimited(msg);
  await detectHTMLLimited(msg);
};

// Establish a connection with the database
export const dbConnect = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI, {});
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
