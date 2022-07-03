import type { GuildMember } from 'discord.js';

import { partitionʹ } from '../../../utils/partition.js';
import { NOTIFY_ROLES } from '../consts/notifyRoles.js';
import { ROLES } from '../consts/roles.js';

const roleNames = new Set([...ROLES, ...NOTIFY_ROLES].map(x => x.name));

export const getAddRemoveRoles = (
  member: GuildMember
): [string[], string[]] => {
  const existingRoles = new Set(member.roles.cache.map(x => x.name));

  return partitionʹ(role => !existingRoles.has(role), roleNames);
};
