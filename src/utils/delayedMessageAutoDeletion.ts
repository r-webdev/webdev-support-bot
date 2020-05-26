import { Message } from 'discord.js';

import { missingRightsDeletion } from './errors';

const THIRTY_SECONDS_IN_MS = 30 * 1000;

const delayedMessageAutoDeletion = (
  msg: Message,
  timeout = THIRTY_SECONDS_IN_MS
) => {
  setTimeout(() => {
    msg.delete().catch(error => {
      console.warn("Couldn't delete message", error);

      msg.edit(missingRightsDeletion).catch(() => {
        console.info(
          "Couldn't edit message after trying to delete, probably removed by someone else."
        );
      });
    });
  }, timeout);
};

export default delayedMessageAutoDeletion;
