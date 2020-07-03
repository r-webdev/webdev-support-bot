import { Message } from 'discord.js';

import { POINT_DECAY_TIMER } from '../env';
import HelpfulRoleMember from './db_model';

let lastCleanup = new Date();

const cleanup = async ({ guild: { id: guild } }: Message) => {
  try {
    await HelpfulRoleMember.update(
      { guild, points: { $gt: 0 } },
      { $inc: { points: -1 } }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('catch -> cleanup():', error);
  }
};

export default async (msg: Message) => {
  const now = new Date();
  const diff = (now.getTime() - lastCleanup.getTime()) / (1000 * 3600);

  if (diff >= Number(POINT_DECAY_TIMER)) {
    lastCleanup = now;

    await cleanup(msg);
  }
};
