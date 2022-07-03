import type { MessageReaction, User } from 'discord.js';

export const validReactions = {
  deletion: '❌',
  // order is important here
  indices: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
};

export const reactionFilterBuilder =
  (initialMessageAuthorId: string, currentlyValidEmojis: string[]) =>
  ({ emoji: { name } }: MessageReaction, user: User): boolean =>
    user.id === initialMessageAuthorId &&
    // validate reaction via whitelist
    currentlyValidEmojis.includes(name);

export const awaitReactionConfig = {
  errors: ['time'],
  max: 1,
  time: 60 * 1000,
};
