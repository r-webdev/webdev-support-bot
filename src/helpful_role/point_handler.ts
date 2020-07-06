import { Message, GuildMember } from 'discord.js';

import { HELPFUL_ROLE_ID, HELPFUL_ROLE_POINT_THRESHOLD } from '../env';
import { createEmbed } from '../utils/discordTools';
import HelpfulRoleMember from './db_model';

import { User } from '.';

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

const pointHandler = async (userID: string, msg: Message) => {
  const details = {
    guild: msg.guild.id,
    user: userID,
  };

  const guildMember = msg.guild.members.cache.find(u => u.id === userID);

  // Break if there's no user or the user is a bot.
  if (!guildMember || guildMember.user.bot) {
    return;
  }

  let user: User = await HelpfulRoleMember.findOne(details);
  if (!user) {
    user = await HelpfulRoleMember.create(details);
  }

  // Add a point to the user
  user.points++;

  // Check if the user has enough points to be given the helpful role
  if (user.points >= Number.parseInt(HELPFUL_ROLE_POINT_THRESHOLD)) {
    await grantHelpfulRole(guildMember, msg);
  }

  try {
    const updated = await user.save();
    // eslint-disable-next-line no-console
    console.log(`${updated.id} => ${updated.points}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('user.save():', error);
  }
};

export default pointHandler;
