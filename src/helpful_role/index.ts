import { MessageReaction } from 'discord.js';
import { Document } from 'mongoose';

import pointHandler from './point_handler';

export interface IUser extends Document {
  user?: string;
  points?: number;
}

export default async (reaction: MessageReaction) => {
  // Break if the author of the message is trying to upvote his own solution
  if (reaction.users.cache.find(u => u.id === reaction.message.author.id))
    return;

  // Give the user a point
  await pointHandler(reaction.message.member.id, reaction.message);
};
