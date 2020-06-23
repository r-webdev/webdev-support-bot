import { Message } from 'discord.js';

import { IUser } from '../../helpful_role';
import User from '../../helpful_role/db_model';

export default async (msg: Message) => {
  try {
    const user: IUser = await User.findOne({ user: msg.author.id });
    msg.reply(user.points ? user.points : 0);
  } catch (error) {
    console.error('catch -> points/index.ts:', error);
  }
};
