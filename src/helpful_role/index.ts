import { Message } from 'discord.js';
import { Document } from 'mongoose';

import { HELPFUL_ROLE_ID } from '../env';
import HelpfulRoleMemberModel from './db_model';

export interface IUser extends Document {
  user?: string;
  points?: number;
}

export default async (message: Message) => {
  // Check if the message author has the helpful role
  const isHelpfulRoleMember = message.member.roles.cache.find(
    r => r.id === HELPFUL_ROLE_ID
  );
  if (!isHelpfulRoleMember) return;

  // Find or create a database entry
  let user: IUser = await HelpfulRoleMemberModel.findOne({
    user: message.member.id,
  });
  if (!user)
    user = await HelpfulRoleMemberModel.create({
      user: message.member.id,
    });

  // Add a point to the user
  user.points++;

  // Save the user
  user
    .save()
    .then(updated => console.log(`${updated.id} => ${updated.points}`))
    .catch(error => console.error('user.save():', error));
};
