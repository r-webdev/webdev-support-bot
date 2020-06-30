import { Message } from 'discord.js';

import { HELPFUL_ROLE_ID } from '../env';
import { createEmbed } from '../utils/discordTools';
import HelpfulRoleMember from './db_model';

import { IUser } from '.';

const grantHelpfulRole = async (userID: string, msg: Message) => {
  const user = msg.guild.members.cache.find(u => u.id === userID);
  if (!user) return;

  // Check if the user has the role
  if (user.roles.cache.find(r => r.id === HELPFUL_ROLE_ID)) return;

  // Add the role to the user
  await user.roles.add(HELPFUL_ROLE_ID);

  // Send notification message
  msg.channel.send(
    createEmbed({
      description: `<@!${userID}> has been granted the <@&${HELPFUL_ROLE_ID}> role!`,
      footerText: 'Helpful Role Handler',
      provider: 'spam',
      title: 'A user has received the Helpful role!',
    })
  );
};

export default async (userID: string, msg: Message) => {
  let user: IUser = await HelpfulRoleMember.findOne({
    user: userID,
  });
  if (!user)
    user = await HelpfulRoleMember.create({
      user: userID,
    });

  // Add a point to the user
  user.points++;

  // Check if the user has enough points to be given the helpful role
  if (user.points >= 3) await grantHelpfulRole(userID, msg);

  // Save the user
  user
    .save()
    .then(updated => console.log(`${updated.id} => ${updated.points}`))
    .catch(error => console.error('user.save():', error));
};
