import { Message } from 'discord.js';

import { ADMIN_ROLE_ID, MOD_ROLE_ID } from '../../env';
import { IUser } from '../../helpful_role';
import HelpfulRoleMember from '../../helpful_role/db_model';
import { extractUserID } from '../../thanks';
import { createEmbed } from '../../utils/discordTools';

const resetPoints = async (mention: string, adminID: string) => {
  const userID = extractUserID(mention);
  if (!userID)
    return createEmbed({
      description: `An invalid user ID has been provided.`,
      fields: [
        { inline: true, name: 'Admin/Moderator', value: `<@!${adminID}>` },
      ],
      footerText: 'Admin: Points Handler',
      provider: 'spam',
      title: 'Points Handler',
    });

  const user: IUser = await HelpfulRoleMember.findOne({ user: userID });
  if (!user)
    return createEmbed({
      description: `The provided ID: ${
        '' + userID + ''
      } is not bound to any user.`,
      fields: [
        { inline: true, name: 'Admin/Moderator', value: `<@!${adminID}>` },
      ],
      footerText: 'Admin: Points Handler',
      provider: 'spam',
      title: 'Points Handler',
    });

  user.points = 0;
  await user.save();

  return createEmbed({
    description: `<@!${user.user}>'s points have been reset.`,
    fields: [
      { inline: true, name: 'Admin/Moderator', value: `<@!${adminID}>` },
    ],
    footerText: 'Admin: Points Handler',
    provider: 'spam',
    title: 'Points Handler',
  });
};

export default async (msg: Message) => {
  const isModOrAdmin = () =>
    msg.member.roles.cache.find(
      r => r.id === ADMIN_ROLE_ID || r.id === MOD_ROLE_ID
    );
  try {
    // Check for any flags
    const content = msg.content.trim().split(' ');

    // Flags and ID checking users for points are admin/mod-only commands
    if (content.length > 1 && isModOrAdmin()) {
      const [_, flag, mention] = content;

      switch (flag) {
        case 'reset':
          const res = await resetPoints(mention, msg.author.id);
          msg.channel.send(res);
          break;
        default:
          break;
      }
    } else {
      const user: IUser = await HelpfulRoleMember.findOne({
        user: msg.author.id,
      });

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
    }
  } catch (error) {
    console.error('catch -> points/index.ts:', error);
  }
};
