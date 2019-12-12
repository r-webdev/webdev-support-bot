const { missingRightsDeletion } = require('./errors');

const THIRTY_SECONDS_IN_MS = 30 * 1000;

/**
 *
 * @param {Message} msg
 * @param {number} timeout
 */
const delayedMessageAutoDeletion = (msg, timeout = THIRTY_SECONDS_IN_MS) => {
  setTimeout(() => {
    msg.delete().catch(error => {
      console.error(error);
      msg.edit(missingRightsDeletion);
    });
  }, timeout);
};

module.exports = delayedMessageAutoDeletion;
