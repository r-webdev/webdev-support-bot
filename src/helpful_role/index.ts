import { Message } from 'discord.js';

import { HELPFUL_ROLE_ID } from '../env';

export default (message: Message) => {
  // Check if the message author has the helpful role
  const isHelpfulRoleMember = message.member.roles.cache.find(
    r => r.id === HELPFUL_ROLE_ID
  );
  if (!isHelpfulRoleMember) return;

  // Find or create a database entry
};
