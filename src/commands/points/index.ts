import { Message } from 'discord.js';

import { IUser } from '../../helpful_role';
import User from '../../helpful_role/db_model';
import { createEmbed } from '../../utils/discordTools';
import { userNotFound } from '../../utils/errors';

export default async (msg: Message) => {
  try {
    const user: IUser = await User.findOne({ user: msg.author.id });
    if (!user) throw new Error(userNotFound);

    const output = createEmbed({
      description: `You have accumulated ${user.points} point${
        user.points !== 1 ? 's' : ''
      }.`,
      footerText: 'Helpful User Points',
      provider: 'spam',
      title: msg.author.tag,
    });

    msg.channel.send(output);
  } catch (error) {
    console.error('catch -> points/index.ts:', error);
  } finally {
    msg.delete();
  }
};
