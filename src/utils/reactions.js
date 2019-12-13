const validReactions = {
  deletion: '❌',
  // order is important here
  indices: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
};

/**
 *
 * @param {string} initialMessageAuthorId
 * @param {string[]} currentlyValidEmojis
 */
const reactionFilterBuilder = (
  initialMessageAuthorId,
  currentlyValidEmojis,
) => ({ emoji: { name } }, user) =>
  user.id === initialMessageAuthorId &&
  // validate reaction via whitelist
  currentlyValidEmojis.includes(name);

const awaitReactionConfig = {
  max: 1,
  time: 60 * 1000,
  errors: ['time'],
};

module.exports = {
  validReactions,
  reactionFilterBuilder,
  awaitReactionConfig,
};
