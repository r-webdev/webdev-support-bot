import { Message } from 'discord.js';

import { IUser } from '../../helpful_role';
import User from '../../helpful_role/db_model';

export default async (msg: Message) => {
  try {
    const topUsers = [...(await User.find().sort({ points: -1 }).limit(10))];
    const output = topUsers.reduce(
      (acc, curr: IUser, i) =>
        (acc += `${i + 1}. <@!${curr.user}> -> ${curr.points}\n`),
      ''
    );

    msg.channel.send(output);
  } catch (error) {
    console.error('catch -> leaderboard/index.ts', error);
  }
};
