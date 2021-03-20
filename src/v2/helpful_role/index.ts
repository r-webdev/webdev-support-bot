import { MessageReaction, User } from 'discord.js';
import { Document } from 'mongoose';

import { IS_PROD } from '../env';
import pointHandler from './point_handler';

/**
 * If you are not sure what the unicode for a certain emoji is,
 * consult the emojipedia. https://emojipedia.org/
 */
export const allowedEmojis = ['🆙', '⬆️', '⏫', '🔼'];

export interface IUser extends Document {
  user?: string;
  points?: number;
}

const handleHelpfulRole = async (reaction: MessageReaction, user: User) => {
  // Break if the author of the message is trying to upvote his own solution
  if (
    IS_PROD && // Enable upvoting own messages for development purposes
    reaction.users.cache.find(u => u.id === reaction.message.author.id)
  ) {
    return;
  }

  // Create a list of user IDs to conduct a check if the user has already upvoted the message with another emoji.
  let users: string[] = [];

  reaction.message.reactions.cache.forEach(r => {
    if (
      allowedEmojis
        .filter(e => e !== reaction.emoji.name)
        .includes(r.emoji.name)
    ) {
      users = [...users, ...r.users.cache.keyArray()];
    }
  });

  // Remove duplicates
  users = [...new Set(users)];

  // Check if the user has already reacted to the message with another "upvote" emoji
  if (users.includes(user.id)) {
    return;
  }

  // Give the user a point
  await pointHandler(reaction.message.member.id, reaction.message, user.id);
};

export default handleHelpfulRole;
