const NodeCache = require('node-cache');

const numberOfAllowedMessages = parseInt(
  process.env.NUMBER_OF_ALLOWED_MESSAGES
);
const cacheRevalidationWindow =
  parseInt(process.env.CACHE_REVALIDATION_IN_SECONDS) * 1000;

const cache = new NodeCache({
  stdTTL: parseInt(process.env.FINAL_CACHE_EXPIRATION_IN_SECONDS),
  checkperiod: cacheRevalidationWindow,
});

/**
 * - Check the time elapsed between the first message and the last one.
 * - If the time difference is less than or equal to the timer, return true
 * - Else, return false.
 *
 * @param {number[]} timestamps
 *
 * @returns {boolean}
 */
const isSurpassingSpamThreshold = (timestamps) => {
  if (timestamps.length <= numberOfAllowedMessages) {
    return false;
  }

  const creationOfFirstMessage = timestamps[0];
  const creationOfLastMessages = timestamps[timestamps.length - 1];

  const difference = creationOfLastMessages - creationOfFirstMessage;

  return difference <= cacheRevalidationWindow;
};

/**
 * - Implement a simple cache, in which each message lives in for 10 seconds
 * - The key for the cache will be set to the user ID
 * - If a user sends `numberOfAllowedMessages` in the span of the `timeWindow`, call the ~~c~~mods
 * @param {import('discord.js').Message} msg
 *
 * @returns {null | {
 * userID: string;
 * username: string;
 * discriminator: string;
 * channel:
 *  import('discord.js').TextChannel
 *  | import('discord.js').DMChannel
 *  | import('discord.js').NewsChannel;
 * msgID: string;
 * server: import('discord.js').Guild
 * }}
 *
 */
module.exports = ({
  channel,
  id: msgID,
  guild: server,
  author: { bot, id: userID, username, discriminator },
}) => {
  // Bail if the user is a bot
  if (bot) {
    return;
  }

  const previousEntry = cache.get(userID);
  const now = Date.now();

  if (!previousEntry) {
    // create entry and bail
    cache.set(userID, {
      wasRecentlyWarned: false,
      timestamps: [now],
    });
    return null;
  }

  const { wasRecentlyWarned, timestamps } = previousEntry;

  // prevent spam by the bot itself
  if (wasRecentlyWarned) {
    // keep this cache set active so we dont warn about the same user until its
    // been resolved
    cache.set(userID, {
      ...previousEntry,
      timestamps: [...timestamps.slice(1), now],
    });
    return null;
  }

  if (!isSurpassingSpamThreshold(timestamps)) {
    const newTimestamps = [
      ...(timestamps.length <= numberOfAllowedMessages
        ? timestamps
        : timestamps.slice(1)),
      now,
    ];

    cache.set(userID, {
      ...previousEntry,
      timestamps: newTimestamps,
    });
    return null;
  }

  // remember this user was warned to prevent the bot from spamming about this user
  cache.set(userID, {
    ...previousEntry,
    timestamps: [...timestamps, now],
    wasRecentlyWarned: true,
  });

  // return metadata about spammer
  return {
    userID,
    username,
    discriminator,
    channel,
    msgID,
    server,
  };
};
