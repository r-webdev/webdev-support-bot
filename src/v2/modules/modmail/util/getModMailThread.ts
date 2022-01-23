import type { Guild, TextChannel, ThreadChannel, User } from 'discord.js';

import { ModMailThread } from '../db/modmail_thread.js';
import { cache } from "./cache";


export const getModMailThread = async (guild: Guild, user: User): Promise<ThreadChannel | undefined> => {
  const cachedThread = cache.get(`${guild.id}|${user.id}`);

  if (cachedThread) {
    console.log("Cached from",`${guild.id}|${user.id}`)
    return cachedThread;
  }

  const modmail = await ModMailThread.findOne({
    guildId: guild.id,
    userId: user.id,
    closedAt: { $exists: false }
  }).exec();

  if (!modmail) {
    return;
  }

  const channel = await guild.channels.fetch(modmail.channelId) as TextChannel;
  if (!channel) {
    throw new Error("Channel missing. Perhaps deleted");
  }

  const thread = await channel.threads.fetch(modmail.threadId);
  if (!thread) {
    throw new Error("Thread missing. Perhaps deleted");
  }

  cache.set(`${guild.id}|${user.id}`, thread);
  cache.set(`${modmail.threadId}`, thread);

  return thread;
};
