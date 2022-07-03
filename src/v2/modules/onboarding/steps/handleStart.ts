import type { Guild, GuildMember } from 'discord.js';
import { MessageActionRow, MessageButton } from 'discord.js';

import type { UserStateType } from '../db/user_state';
import { getThread } from '../utils/getThread';

export async function handleStart(
  guild: Guild,
  member: GuildMember,
  oldState: UserStateType,
  fromStart: boolean
): Promise<void> {
  const thread = await getThread(guild, oldState.threadId);
  const pinned = await thread.messages.fetchPinned();

  const rulesMsg = pinned.last();

  setTimeout(async () => {
    await rulesMsg.edit({
      components: [
        new MessageActionRow().addComponents([
          new MessageButton()
            .setStyle('SUCCESS')
            .setLabel('I have read, and agree to follow the rules')
            .setCustomId('onboarding🤔rules_agreed'),
        ]),
      ],
    });
  }, 2000);

  if (fromStart) {
    await pinned.last().reply({
      content: `Hey ${member.toString()}, seems like something went wrong during your onboarding, this could be because you left during it or the bot was down. You should be able to continue from here.`,
    });
  }
}
