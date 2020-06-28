import { MessageReaction } from 'discord.js';
import { Document } from 'mongoose';

import { HELPFUL_ROLE_ID } from '../env';
import pointHandler from './point_handler';

export interface IUser extends Document {
  user?: string;
  points?: number;
}

export default async (reaction: MessageReaction) => {
  // Break if the author of the message is trying to upvote his own solution
  if (reaction.users.cache.find(u => u.id === reaction.message.author.id))
    return;

  // Check if the message author has the helpful role
  const isHelpfulRoleMember = reaction.message.member.roles.cache.find(
    r => r.id === HELPFUL_ROLE_ID
  );
  if (!isHelpfulRoleMember) return; // Handle the case if the user does not have the helpful role

  // Give the user a point
  await pointHandler(reaction.message.member.id);
};
