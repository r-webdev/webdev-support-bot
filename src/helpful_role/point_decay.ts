import { POINT_DECAY_TIMER } from '../env';
import HelpfulRoleMember from './db_model';

let lastCleanup = new Date();

const cleanup = async () => {
  try {
    const res = await HelpfulRoleMember.update(
      { points: { $gt: 0 } },
      { $inc: { points: -1 } }
    );

    console.log(res);
  } catch (error) {
    console.error('catch -> cleanup():', error);
  }
};

export default async () => {
  const now = new Date();
  const diff = (now.getTime() - lastCleanup.getTime()) / (1000 * 3600);

  if (diff >= Number(POINT_DECAY_TIMER)) {
    lastCleanup = now;

    await cleanup();
  } else {
    // TODO: Remove else block before deployment
    console.log('Cleanup available in', diff, 'hours');
  }
};
