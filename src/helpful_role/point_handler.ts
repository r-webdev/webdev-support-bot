import { Message, GuildMember } from 'discord.js';

import { startTime } from '..';
import {
  IS_PROD,
  HELPFUL_ROLE_ID,
  HELPFUL_ROLE_POINT_THRESHOLD,
  POINT_LIMITER_IN_MINUTES,
} from '../env';
import { cache } from '../spam_filter';
import { createEmbed } from '../utils/discordTools';
import HelpfulRoleMember from './db_model';

import { IUser } from '.';

const grantHelpfulRole = async (user: GuildMember, msg: Message) => {
  // Check if the user has the role
  if (user.roles.cache.find(r => r.id === HELPFUL_ROLE_ID)) {
    return;
  }

  // Add the role to the user
  await user.roles.add(HELPFUL_ROLE_ID);

  // Send notification message
  await msg.channel.send(
    createEmbed({
      description: `<@!${user.id}> has been granted the <@&${HELPFUL_ROLE_ID}> role!`,
      footerText: 'Helpful Role Handler',
      provider: 'spam',
      title: 'A user has received the Helpful role!',
    })
  );
};

export const generatePointsCacheEntryKey = (
  receivingUserID: string,
  pointGiverUserID: string
) => `point-${receivingUserID}-${pointGiverUserID}`;

const pointHandler = async (
  userID: string,
  msg: Message,
  reactionHandlerUserID: string = null
) => {
  const pointGiverUserID = reactionHandlerUserID || msg.author.id;

  const cacheKey = generatePointsCacheEntryKey(userID, pointGiverUserID);

  const guildMember = msg.guild.members.cache.find(u => u.id === userID);

  // Break if there's no user or the user is a bot.
  if (!guildMember || guildMember.user.bot) {
    return;
  }

  const entry: number = cache.get(cacheKey);

  // Check if the message's been created before the bot's startup
  if (startTime > msg.createdAt) {
    return;
  }

  // Check if the user's on cooldown to give a point to the message author/mentioned user
  if (entry) {
    const diff = Math.round(
      Number.parseInt(POINT_LIMITER_IN_MINUTES) - (Date.now() - entry) / 60000
    );

    const dm = await msg.guild.members.cache.get(pointGiverUserID).createDM();

    dm.send(
      `You cannot give a point to <@!${userID}>. Please try again in ${diff} minute${
        diff === 1 ? '' : 's'
      }.`
    );

    return;
  }

  const details = {
    guild: msg.guild.id,
    user: userID,
  };

  let user: IUser = await HelpfulRoleMember.findOne(details);
  if (!user) {
    user = await HelpfulRoleMember.create(details);
  }

  // Add a point to the user
  user.points++;

  // Cache the action
  cache.set(
    cacheKey,
    Date.now(),
    Number.parseInt(POINT_LIMITER_IN_MINUTES) * 60
  );

  // Check if the user has enough points to be given the helpful role
  if (user.points >= Number.parseInt(HELPFUL_ROLE_POINT_THRESHOLD)) {
    await grantHelpfulRole(guildMember, msg);
  }

  try {
    const updated = await user.save();

    if (!IS_PROD) {
      // eslint-disable-next-line no-console
      console.log(`${updated.id} => ${updated.points}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('user.save():', error);
  }
};

export default pointHandler;
