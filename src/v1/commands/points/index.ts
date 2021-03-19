import { Message, GuildMemberRoleManager } from 'discord.js';

import {
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  HELPFUL_ROLE_ID,
  HELPFUL_ROLE_POINT_THRESHOLD,
} from '../../env';
import { IUser } from '../../helpful_role';
import HelpfulRoleMember from '../../helpful_role/db_model';
import { extractUserID } from '../../thanks';
import { createEmbed } from '../../utils/discordTools';

const resetPoints = async (userID: string, msg: Message) => {
  const adminID = msg.author.id;

  const guildMember = msg.guild.members.cache.find(u => u.id === userID);

  // Break if there's no user or the user is a bot
  if (!guildMember || guildMember.user.bot) {
    return;
  }

  if (!userID) {
    return createEmbed({
      description: 'An invalid user ID has been provided.',
      fields: [
        { inline: true, name: 'Admin/Moderator', value: `<@!${adminID}>` },
      ],
      footerText: 'Admin: Points Handler',
      provider: 'spam',
      title: 'Points Handler',
    });
  }

  const user: IUser = await HelpfulRoleMember.findOne({
    guild: msg.guild.id,
    user: userID,
  });

  if (!user) {
    return createEmbed({
      description: `The provided ID: "${userID}" is not bound to any user.`,
      fields: [
        { inline: true, name: 'Admin/Moderator', value: `<@!${adminID}>` },
      ],
      footerText: 'Admin: Points Handler',
      provider: 'spam',
      title: 'Points Handler',
    });
  }

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
  if (!userID && admin) {
    return createEmbed({
      description: `The provided user ID is invalid.`,
      footerText: 'Admin: Points Handler',
      provider: 'spam',
      title,
    });
  }

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

const setPoints = async (userID: string, amount: string, msg: Message) => {
  const points = Number.parseInt(amount);
  if (Number.isNaN(points)) {
    return (
      'Invalid argument provided for the points parameter.\nUsage example: ```' +
      '!points set @user 10' +
      '```'
    );
  }

  const guildMember = msg.guild.members.cache.find(u => u.id === userID);
  if (!guildMember) {
    return (
      'Invalid user mention provided.\nUsage example: ```' +
      '!points set @user 10' +
      '```'
    );
  }

  const user: IUser = await HelpfulRoleMember.findOne({
    guild: msg.guild.id,
    user: userID,
  });

  if (user) {
    user.points = points;
    await user.save();
  }

  const output = createEmbed({
    description:
      '```' + `!points set @${guildMember.user.username} ${points}` + '```',
    fields: [
      {
        inline: false,
        name: 'User',
        value: `<@!${userID}>`,
      },
      {
        inline: false,
        name: 'Admin/Moderator',
        value: `<@!${msg.author.id}>`,
      },
    ],
    footerText: 'Admin: Points Handler',
    provider: 'spam',
    title: 'Points have been set manually for a user',
  });

  // Set or remove the role if necessary
  if (user.points >= Number.parseInt(HELPFUL_ROLE_POINT_THRESHOLD)) {
    await guildMember.roles.add(HELPFUL_ROLE_ID);
    output.embed.fields.push({
      inline: false,
      name: 'Role access',
      value: 'Granted',
    });
  } else {
    await guildMember.roles.remove(HELPFUL_ROLE_ID);
    output.embed.fields.push({
      inline: false,
      name: 'Role access',
      value: 'Revoked',
    });
  }

  return output;
};

export const isModOrAdmin = ({ cache }: GuildMemberRoleManager) =>
  cache.find(({ id }) => id === ADMIN_ROLE_ID || id === MOD_ROLE_ID);

const handlePointsRequest = async (msg: Message) => {
  try {
    // Check for any flags
    const cleanContent = msg.content.trim().toLowerCase().split(' ');

    // Flags and ID checking users for points are admin/mod-only commands
    if (cleanContent.length > 1 && isModOrAdmin(msg.member.roles)) {
      const [, flag, mention, points] = cleanContent;

      const userID = mention ? extractUserID(mention) : '';

      switch (flag) {
        case 'reset':
          const resetEmbed = await resetPoints(userID, msg);

          return await msg.channel.send(resetEmbed);
        case 'check':
          const pointsEmbed = await getPoints(
            userID,
            'Points check for mentioned user',
            msg,
            true
          );

          return await msg.channel.send(pointsEmbed);
        case 'set':
          const setEmbed = await setPoints(userID, points, msg);

          return await msg.channel.send(setEmbed);
        default:
          break;
      }

      return;
    }

    const getPointsEmbed = await getPoints(msg.author.id, msg.author.tag, msg);

    await msg.channel.send(getPointsEmbed);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('catch -> points/index.ts:', error);
  }
};

export default handlePointsRequest;
