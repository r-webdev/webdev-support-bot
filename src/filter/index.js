const NodeCache = require('node-cache');
const cleanContent = require('../utils/cleanContent');

const cache = new NodeCache({ stdTTL: 10, checkperiod: 5 });

function generateMsg(msg) {
  return {
    body: cleanContent(msg),
    created: new Date().getTime(),
  };
}

/**
 * Concept:
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
  const numberOfAllowedMessages = 5;
  const timer = 2;
  /**
   * Concept:
   * - Implement a simple cache, in which each message lives in for 10 seconds
   * - The key for the cache will be set to the user ID
   * - If a user sends 5 messages in the span of the timer, warn the user
   */
  // Check if the user has cached messages
  const messages = cache.get(msg.author.id);
  // If not, set the user, the message content and the current timestamp into the cache and break out
  if (!messages) return cache.set(msg.author.id, [generateMsg(msg)]);
  // As the threshold has not been reached, add the new message to the cache
  if (messages.length < numberOfAllowedMessages)
    return cache.set(msg.author.id, [...messages, generateMsg(msg)]);
  // Else, check if the user is spamming.
  const isSpam = checkForSpam(messages, timer);
  if (!isSpam) return cache.del(msg.author.id);
  // Spam detected.
  console.log('Spam!');
};
