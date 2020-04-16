const NodeCache = require('node-cache');
const cleanContent = require('../utils/cleanContent');

const cache = new NodeCache({
  stdTTL: process.env.CACHE_TTL || 10,
  checkperiod: 5,
});

/**
 * @param {import('discord.js').Message} msg */
function generateMsg(msg) {
  return {
    body: cleanContent(msg),
    created: new Date().getTime(),
  };
}

/** NOTE: Concept
 * - Check the time elapsed between the first message and the last one.
 * - If the time difference is less than or equal to the timer, return true
 * - Else, return false.
 */
const checkForSpam = (messages, timer) => {
  const difference =
    messages[messages.length - 1].created - messages[0].created;
  return Math.floor(difference / 1000) <= timer;
};

/**
 * @param {import('discord.js').Message} msg */
module.exports = (msg) => {
  /** NOTE: Concept
   * - Implement a simple cache, in which each message lives in for 10 seconds
   * - The key for the cache will be set to the user ID
   * - If a user sends `numberOfAllowedMessages` in the span of the `timer`, warn the user
   */
  if (msg.author.bot) return; // Bail if the user is a bot
  const numberOfAllowedMessages = process.env.NUMBER_OF_ALLOWED_MESSAGES || 5;
  const timer = process.env.TIMER || 2;
  const { channel, id: msgID, guild: server } = msg;
  const { id: userID, username, discriminator } = msg.author;
  // Check if the user has cached messages
  const messages = cache.get(userID);
  // If not, set the user, the message content and the current timestamp into the cache and break out
  if (!messages) {
    cache.set(userID, [generateMsg(msg)]);
    return false;
  }
  // As the threshold has not been reached, add the new message to the cache
  if (messages.length < numberOfAllowedMessages) {
    cache.set(userID, [...messages, generateMsg(msg)]);
    return false;
  }
  // Else, check if the user is spamming.
  const isSpam = checkForSpam(messages, timer);
  if (!isSpam) {
    cache.del(userID);
    return false;
  }
  // Remove the user from the cache
  cache.del(userID);
  // Return details of the incident to be handled further
  return { userID, username, discriminator, channel, msgID, server };
};
