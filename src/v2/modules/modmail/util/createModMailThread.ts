import { Guild, ThreadChannel, User } from 'discord.js';
import { MODMAIL_CHANNEL_ID } from '../../../env.js';
import { ModMailThread } from '../db/modmail_thread.js';
import { cache } from "./cache";
import { dateFormat } from "./formatter";


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
  });

  cache.set(`${guild.id}|${user.id}`, threadChannel);

  return threadChannel;
};
