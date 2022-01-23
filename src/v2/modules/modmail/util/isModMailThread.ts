import type { Guild, TextChannel } from 'discord.js';

import { ModMailThread } from '../db/modmail_thread.js';
import { cache } from "./cache";


export const isModMailThread = async (guild: Guild, id: string): Promise<boolean> => {
  const cachedThread = cache.get(id);

  if (cachedThread) {
    return true;
  }

  const modmail = await ModMailThread.findOne({
    threadId: id,
    closedAt: { $exists: false }
  }).exec();

  if (!modmail) {
    return false;
  }

  const channel = await guild.channels.fetch(modmail.channelId) as TextChannel;
  if (!channel) {
    throw new Error("Channel missing. Perhaps deleted");
  }

  const thread = await channel.threads.fetch(modmail.threadId);
  if (!thread) {
    throw new Error("Thread missing. Perhaps deleted");
  }

  cache.set(`${modmail.guildId}|${modmail.userId}`, thread);
  cache.set(`${modmail.threadId}`, thread);

  return true;
};
