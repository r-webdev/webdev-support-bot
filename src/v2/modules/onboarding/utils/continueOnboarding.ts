import type { GuildMember, Guild, TextChannel } from 'discord.js';

import { ONBOARDING_CHANNEL } from '../../../env';
import type { UserStateType } from '../db/user_state';
import { handleIntroduction } from '../steps/handleIntroduction';
import { handleOnboarded } from '../steps/handleOnboarded';
import { handleRoleSelection } from '../steps/handleRoleSelection';
import { handleStart } from '../steps/handleStart';

export async function continueOnboarding(
  guild: Guild,
  member: GuildMember,
  oldState: UserStateType,
  fromStart = false
): Promise<void> {
  const channel = guild.channels.resolve(ONBOARDING_CHANNEL) as TextChannel;

  switch (oldState.state) {
    case 'START':
      handleStart(guild, member, oldState, fromStart);
      return;
    case 'INTRODUCTION':
      handleIntroduction(guild, member, oldState, fromStart);
      return;
    case 'ROLE_SELECTION':
      handleRoleSelection(guild, member, oldState, fromStart);
      return;
    case 'ONBOARDED':
      handleOnboarded(guild, member, oldState, fromStart);
      return;
    default:
      console.error("Shouldn't have gotten here D:");
  }
}
