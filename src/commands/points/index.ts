import { Message } from 'discord.js';

import { ADMIN_ROLE_ID, MOD_ROLE_ID, HELPFUL_ROLE_ID } from '../../env';
import { IUser } from '../../helpful_role';
import HelpfulRoleMember from '../../helpful_role/db_model';
import { extractUserID } from '../../thanks';
import { createEmbed } from '../../utils/discordTools';

const resetPoints = async (userID: string, msg: Message) => {
  const adminID = msg.author.id;

  const guildMember = msg.guild.members.cache.find(u => u.id === userID);
  if (!guildMember || guildMember.user.bot) return; // Break if there's no user or the user is a bot

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

  const user: IUser = await HelpfulRoleMember.findOne({
    guild: msg.guild.id,
    user: userID,
  });
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

  // Remove the role from the user
  await guildMember.roles.remove(HELPFUL_ROLE_ID);

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

const getPoints = async (
  userID: string,
  title: string,
  msg: Message,
  admin = false
) => {
  if (!userID && admin)
    return createEmbed({
      description: `The provided user ID is invalid.`,
      footerText: 'Admin: Points Handler',
      provider: 'spam',
      title,
    });

  const user: IUser = await HelpfulRoleMember.findOne({
    guild: msg.guild.id,
    user: userID,
  });

  const points = user ? user.points : 0;

  return createEmbed({
    description: `${
      !admin ? 'You have' : 'The user has'
    } accumulated ${points} point${points !== 1 ? 's' : ''}.`,
    footerText: !admin ? 'Helpful User Points' : 'Admin: Points Handler',
    provider: 'spam',
    title,
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

      const userID = mention ? extractUserID(mention) : '';

      switch (flag) {
        case 'reset':
          return msg.channel.send(await resetPoints(userID, msg));
        case 'check':
          return msg.channel.send(
            await getPoints(
              userID,
              'Points check for mentioned user',
              msg,
              true
            )
          );
        default:
          break;
      }
    } else {
      msg.channel.send(await getPoints(msg.author.id, msg.author.tag, msg));
    }
  } catch (error) {
    console.error('catch -> points/index.ts:', error);
  }
};
