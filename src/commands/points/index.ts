import { Message } from 'discord.js';

import { IUser } from '../../helpful_role';
import User from '../../helpful_role/db_model';
import { createEmbed } from '../../utils/discordTools';

export default async (msg: Message) => {
  try {
    const user: IUser = await User.findOne({ user: msg.author.id });
    const points = user ? user.points : 0;

    const output = createEmbed({
      description: `You have accumulated ${points} point${
        points !== 1 ? 's' : ''
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
