import type { Guild, GuildTextBasedChannel, TextChannel, ThreadChannel, User } from 'discord.js';
import { UserResolvable } from 'discord.js';

import { MODMAIL_CHANNEL_ID } from '../../../env.js';
import { Cache } from '../../../utils/Cache.js';
import { emplaceMap } from '../../../utils/mapEmplace.js';
import { ModMailThread } from '../db/modmail_thread.js'

const cache = new Cache<ThreadChannel, string>({
  maxKeys: 10,
  stdTTL: 3600,
})

const formatter = new Intl.DateTimeFormat('en-us', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: "2-digit",
});

function dateFormat(
  date: Date,
  fn: (obj: Record<Intl.DateTimeFormatPartTypes, string | string[]>) => string
) {
  const parts = formatter.formatToParts(date);
  const map = new Map<Intl.DateTimeFormatPartTypes, string | string[]>();

  for (const { type, value } of parts) {
    emplaceMap(map, type, {
      update: existing =>
        Array.isArray(existing) ? [...existing, value] : [existing, value],
      insert: () => value,
    });
  }

  return fn(
    Object.fromEntries(map) as Record<
      Intl.DateTimeFormatPartTypes,
      string | string[]
    >
  );
}

export const getModMailThread = async (guild:Guild,user:User): Promise<ThreadChannel | undefined> => {
  const cachedThread = cache.get(`${guild.id}|${user.id}`)

  if (cachedThread) {
    return cachedThread
  }

  const modmail = await ModMailThread.findOne({
    guildId: guild.id,
    user: user.id,
    closedAt: {$exists: false}
  }).exec()

  if (!modmail) {
    return
  }

  const channel = await guild.channels.fetch(modmail.channelId) as TextChannel
  if (!channel) {
    throw new Error("Channel missing. Perhaps deleted")
  }

  const thread = await channel.threads.fetch(modmail.threadId)
  if (!thread) {
    throw new Error("Thread missing. Perhaps deleted")
  }

  cache.set(`${guild.id}|${user.id}`, thread)

  return thread
}

export const createModMailThread = async (
  guild: Guild,
  user: User
): Promise<ThreadChannel> => {
  const modmailChannel = await guild.channels.fetch(MODMAIL_CHANNEL_ID);
  if (!modmailChannel) {
    throw new Error('Modmail channel could not be found.');
  }
  if (!modmailChannel.isText()) {
    throw new Error('Modmail channel is not a text channel.');
  }
  if (modmailChannel.type === 'GUILD_NEWS') {
    throw new Error("Modmail channel can't be a news channel.");
  }

  const date = dateFormat(
    new Date(),
    _ => `${_.year}-${_.month}-${_.day}_${_.hour}${_.minute}`
  );

  const threadChannel = await modmailChannel.threads.create({
    name: `${user.username}_${user.discriminator} ${date}`,
    autoArchiveDuration: 'MAX',
    reason: 'Test',
  });

  await ModMailThread.create({
    guildId: guild.id,
    channelId: threadChannel.parentId,
    threadId: threadChannel.id,
    userId: user.id,
  })

  cache.set(`${guild.id}|${user.id}`, threadChannel)

  return threadChannel
};


export const getModMailThreadOrCreate = async (guild: Guild, user: User): Promise<ThreadChannel> => {
  const existingThread = await getModMailThread(guild,user)

  return existingThread ?? createModMailThread(guild,user)
}


export const closeThread = async (guild:Guild, user: User): Promise<boolean>  => {
  const thread = await getModMailThread(guild,user)

  if(!thread) {
    return false
  }

  thread.setArchived(true)
  thread.setName(`✅ ${thread.name.replace(/^✅ /u,'')}`)

  cache.del(`${guild.id}|${user.id}`)

  ModMailThread.findOneAndUpdate({
    guildId: guild.id,
    userId: user.id,
    closedAt: {$exists: false}
  }, {
    closedAt: Date.now()
  })

  return true
}
