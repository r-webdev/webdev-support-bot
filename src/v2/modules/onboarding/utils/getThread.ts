import type { Guild, TextChannel, ThreadChannel } from 'discord.js';

import { ONBOARDING_CHANNEL } from '../../../env';

export async function getThread(
  guild: Guild,
  id: string
): Promise<ThreadChannel> {
  const channel = (await guild.channels.fetch(
    ONBOARDING_CHANNEL
  )) as TextChannel;

  return channel.threads.fetch(id);
}
