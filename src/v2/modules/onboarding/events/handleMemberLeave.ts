import type { GuildMember } from 'discord.js';

import { SERVER_ID } from '../../../env';
import { UserState } from '../db/user_state';

export const handleMemberLeave = async (member: GuildMember): Promise<void> => {
  const { user, roles } = member;

  const oldState = await UserState.findOne({
    guild: SERVER_ID,
    userId: user.id,
  });

  const memRoles = roles.cache.filter(x => x.name !== '@everyone');

  if (!oldState) {
    if (memRoles.size === 0) {
      return;
    }
    UserState.create({
      guild: SERVER_ID,
      userId: user.id,
      state: 'ONBOARDED',
      rolesOnLeave: memRoles.map(x => ({ name: x.name, id: x.id })),
    });
    return;
  }

  if (memRoles.size === 0 && !oldState.threadId) {
    await oldState.deleteOne();
    return;
  }
  oldState.rolesOnLeave = roles.cache
    .filter(x => x.name !== '@everyone')
    .map(x => ({ name: x.name, id: x.id }));
  oldState.save();
};
