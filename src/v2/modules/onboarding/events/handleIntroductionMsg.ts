import type { Message } from 'discord.js';

import { INTRO_CHANNEL, NEW_USER_ROLE } from '../../../env.js';
import { UserState } from '../db/user_state.js';
import { continueOnboarding } from '../utils/continueOnboarding.js';
import { getThread } from '../utils/getThread.js';

export const handleIntroductionMsg = async (msg: Message): Promise<void> => {
  if (
    msg.channelId === INTRO_CHANNEL &&
    msg.member.roles.cache.some(x => x.id === NEW_USER_ROLE)
  ) {
    const oldState = await UserState.findOne({
      guild: msg.guild.id,
      userId: msg.author.id,
    });

    const thread = await getThread(msg.guild, oldState.threadId);

    const pinned = await thread.messages.fetchPinned();
    const introMsg = pinned.last();

    introMsg.edit({
      components: [],
    });
    introMsg.reply({
      content: `Thanks for introducing yourself ${msg.member}!`,
    });

    oldState.state = 'ROLE_SELECTION';
    await Promise.all([oldState.save(), introMsg.unpin()]);

    continueOnboarding(msg.guild, msg.member, oldState, false);
  }
};
