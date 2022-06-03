import type { Guild, Message, TextChannel } from 'discord.js';

import { DM_ALT_CHANNEL_ID } from '../../env'
import { DMThread } from '../faux-dms/db/dm_thread.js';
import { cache } from "../modmail/util/cache.js";

export const isDmThread = async (msg: Message): Promise<boolean> => {
  if(!msg.channel.isThread()) {
    return false
  }

  if (msg.channel.parent?.id !== DM_ALT_CHANNEL_ID) {
    return false
  }

  const dmThread = await DMThread.findOne({
    guildId: msg.guild,
    threadId: msg.channelId,
    channelId: msg.channel.parent.id,
    closedAt: { $exists: false }
  }).exec()

  return !!dmThread
};
