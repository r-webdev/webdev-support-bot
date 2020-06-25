import { MessageReaction } from 'discord.js';
import { Document } from 'mongoose';

import { HELPFUL_ROLE_ID } from '../env';
import HelpfulRoleMemberModel from './db_model';

export interface IUser extends Document {
  user?: string;
  points?: number;
}

export default async (reaction: MessageReaction) => {
  // Break if the author of the message is trying to upvote his own solution
  if (reaction.users.cache.find(u => u.id === reaction.message.id)) return;

  // Check if the message author has the helpful role
  const isHelpfulRoleMember = reaction.message.member.roles.cache.find(
    r => r.id === HELPFUL_ROLE_ID
  );
  if (!isHelpfulRoleMember) return; // Handle the case if the user does not have the helpful role

  // Find or create a database entry
  let user: IUser = await HelpfulRoleMemberModel.findOne({
    user: reaction.message.member.id,
  });
  if (!user)
    user = await HelpfulRoleMemberModel.create({
      user: reaction.message.member.id,
    });

  // Add a point to the user
  user.points++;

  // Save the user
  user
    .save()
    .then(updated => console.log(`${updated.id} => ${updated.points}`))
    .catch(error => console.error('user.save():', error));
};
