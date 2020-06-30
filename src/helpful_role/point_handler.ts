import { Guild } from 'discord.js';

import { HELPFUL_ROLE_ID } from '../env';
import HelpfulRoleMember from './db_model';

import { IUser } from '.';

const result = (granted: boolean, message: string) => ({ granted, message });

const grantHelpfulRole = async (userID: string, guild: Guild) => {
  const user = guild.members.cache.find(u => u.id === userID);
  if (!user) return result(false, 'User does not exist.');

  // Check if the user has the role
  if (user.roles.cache.find(r => r.id === HELPFUL_ROLE_ID))
    return result(
      false,
      `<@!${userID}> already has the <@&${HELPFUL_ROLE_ID}> role.`
    );

  // Add the role to the user
  await user.roles.add(HELPFUL_ROLE_ID);
  return result(
    true,
    `<@!${userID}> has been granted the <@&${HELPFUL_ROLE_ID}> role!`
  );
};

export default async (userID: string, guild: Guild) => {
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
  if (user.points >= 10) grantHelpfulRole(userID, guild);

  // Save the user
  user
    .save()
    .then(updated => console.log(`${updated.id} => ${updated.points}`))
    .catch(error => console.error('user.save():', error));
};
