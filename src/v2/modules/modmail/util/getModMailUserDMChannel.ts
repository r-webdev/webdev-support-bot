import type { DMChannel, Guild } from 'discord.js';

import { ModMailThread } from '../db/modmail_thread.js';


export const getModMailUserDMChannel = async (guild: Guild, threadId: string): Promise<DMChannel | null> => {
  const modmail = await ModMailThread.findOne({
    threadId,
    closedAt: { $exists: false }
  }).exec();

  if (!modmail) { return null; }

  const member = await guild.members.fetch(modmail.userId);

  if (!member) {
    return null;
  }

  return member.createDM();
};
