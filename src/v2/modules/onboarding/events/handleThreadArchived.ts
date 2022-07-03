import type { ThreadChannel } from 'discord.js';

import { INTRO_ROLE, ONBOARDING_CHANNEL, NEW_USER_ROLE } from '../../../env.js';
import { UserState } from '../db/user_state.js';

export async function handleThreadArchived(
  oldThread: ThreadChannel,
  thread: ThreadChannel
): Promise<void> {
  // ignore it if it's not an archive change
  if (oldThread.parentId !== ONBOARDING_CHANNEL) {
    return;
  }
  if (oldThread.archived || !thread.archived) {
    return;
  }

  const userState = await UserState.findOne({
    threadId: oldThread.id,
  });

  if (!userState) {
    return;
  }

  const member = await oldThread.guild.members.fetch(userState.userId);

  if (!member) {
    return;
  }

  if (userState.state === 'ONBOARDED') {
    member.roles.remove([NEW_USER_ROLE, INTRO_ROLE]);
  } else {
    try {
      const dmChannel = await member.createDM();
      await dmChannel.send({
        content: `You've been kicked from the Web Dev Discord Server as you did not complete onboarding in the alloted time. If you'd like to join again, here is a new invite: https://discord.gg/web`,
      });
    } catch (error) {
      console.error(`Failed to create DM thread:`, error);
    }
    try {
      await userState?.deleteOne();
    } catch {
      console.error('Failed to delete user state');
    }

    member.kick(`User did not complete onboarding in the alloted time.`);
  }
}
