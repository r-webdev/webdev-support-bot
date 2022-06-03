import type { Guild, ThreadChannel, User } from 'discord.js';

import { createModMailThread } from "./createModMailThread";
import { getModMailThread } from "./getModMailThread";



export const getModMailThreadOrCreate = async (guild: Guild, user: User): Promise<{ thread: ThreadChannel; existing: boolean; }> => {
  const existingThread = await getModMailThread(guild, user);

  return { thread: existingThread ?? await createModMailThread(guild, user), existing: !!existingThread };
};
