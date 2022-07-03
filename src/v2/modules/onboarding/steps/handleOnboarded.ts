import type { Guild, GuildMember } from 'discord.js';

import type { UserStateType } from '../db/user_state';
import { getThread } from '../utils/getThread';

export async function handleOnboarded(
  guild: Guild,
  member: GuildMember,
  oldState: UserStateType,
  fromStart: boolean
): Promise<void> {
  const thread = await getThread(guild, oldState.threadId);

  if (!fromStart) {
    thread.send(`🎉 That's it! We hope you enjoy your time here ${member.toString()}. If you want to update your roles again, you can do that here: <#460881799430537237>.

You have access to this thread and the onboarding channel until <t:${Math.round(
      thread.archivedAt.getTime() / 1000
    )}>.`);
  }
}
