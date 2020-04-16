const NodeCache = require('node-cache');

const numberOfAllowedMessages = process.env.NUMBER_OF_ALLOWED_MESSAGES;
const timer = process.env.TIMER;

const cache = new NodeCache({
  stdTTL: process.env.CACHE_TTL,
  checkperiod: 5,
});

/**
 * - Check the time elapsed between the first message and the last one.
 * - If the time difference is less than or equal to the timer, return true
 * - Else, return false.
 *
 * @param {ReturnType<generateMsg>[]} messages
 * @param {number} timer
 *
 * @returns {boolean}
 */
const isSurpassingSpamThreshold = (messages, timer) => {
  const creationOfFirstMessage = messages[0];
  const creationOfLastMessages = messages[messages.length - 1];

  const difference = creationOfLastMessages - creationOfFirstMessage;

  return Math.floor(difference / 1000) <= timer;
};

/**
 * - Implement a simple cache, in which each message lives in for 10 seconds
 * - The key for the cache will be set to the user ID
 * - If a user sends `numberOfAllowedMessages` in the span of the `timer`, warn the user
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

  // Check if the user has cached messages
  const messages = cache.get(userID);
  const now = Date.now();

  // If not, set the user, the message content and the current timestamp into the cache and break out
  if (!messages) {
    cache.set(userID, [now]);
    return null;
  }

  // As the threshold has not been reached, add the new message to the cache
  if (messages.length < numberOfAllowedMessages) {
    cache.set(userID, [...messages, now]);
    return null;
  }

  // Else, check if the user is spamming.
  if (!isSurpassingSpamThreshold(messages, timer)) {
    cache.del(userID);
    return null;
  }

  // Remove the user from the cache
  cache.del(userID);

  // Return details of the incident to be handled further
  return {
    userID,
    username,
    discriminator,
    channel,
    msgID,
    server,
  };
};
