import type { Guild, GuildMember } from 'discord.js';
import { MessageActionRow, MessageButton } from 'discord.js';

import { INTRO_CHANNEL, INTRO_ROLE } from '../../../env';
import type { UserStateType } from '../db/user_state';
import { getThread } from '../utils/getThread';
import { sneakPin } from '../utils/sneakPin';

export async function handleIntroduction(
  guild: Guild,
  member: GuildMember,
  oldState: UserStateType,
  fromStart: boolean
): Promise<void> {
  const thread = await getThread(guild, oldState.threadId);
  const pinned = await thread.messages.fetchPinned();

  if (pinned.size === 0) {
    const msg = await thread.send({
      content: `:point_left: You should now have access to the <#${INTRO_CHANNEL}> channel. It would be great if you could introduce yourself in that channel. We understand if you don't want to, however, so feel free to skip this step now, or do it later`,
      components: [
        new MessageActionRow().addComponents([
          new MessageButton()
            .setLabel('Skip')
            .setStyle('DANGER')
            .setEmoji('⏩')
            .setCustomId('onboarding🤔skip_intro'),
        ]),
      ],
    });

    await sneakPin(msg);

    member.roles.add(INTRO_ROLE);
  }

  if (fromStart) {
    await pinned.last().reply({
      content: `Hey ${member.toString()}, seems like something went wrong during your onboarding, this could be because you left during it or the bot was down. You should be able to continue from here.`,
    });
  }
}
