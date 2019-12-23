const { missingRightsDeletion } = require('./errors');

const THIRTY_SECONDS_IN_MS = 30 * 1000;

/**
 *
 * @param {import('discord.js').Message} msg
 * @param {number} timeout
 */
const delayedMessageAutoDeletion = (msg, timeout = THIRTY_SECONDS_IN_MS) => {
  setTimeout(() => {
    msg.delete().catch(error => {
      console.warn("Couldn't delete message", error);
      msg.edit(missingRightsDeletion).catch(() => {
        console.info(
          "Couldn't edit message after trying to delete, probably removed by someone else.",
        );
      });
    });
  }, timeout);
};

module.exports = delayedMessageAutoDeletion;
