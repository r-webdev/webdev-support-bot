import type { MessageReaction, User } from 'discord.js';
import type { Document } from 'mongoose';

import { IS_PROD } from '../env';
import { thanks } from '../utils/emojis';
import pointHandler from './point_handler';

/**
 * If you are not sure what the unicode for a certain emoji is,
 * consult the emojipedia. https://emojipedia.org/
 */
export const allowedEmojis = ['🆙', '⬆️', '⏫', '🔼', thanks];

export type IUser = {
  user?: string;
  points?: number;
} & Document;

const handleHelpfulRole = async (
  reaction: MessageReaction,
  user: User
): Promise<void> => {
  // Break if the author of the message is trying to upvote his own solution
  if (
    IS_PROD && // Enable upvoting own messages for development purposes
    reaction.users.cache.find(u => u.id === reaction.message.author.id)
  ) {
    return;
  }

  // Create a list of user IDs to conduct a check if the user has already upvoted the message with another emoji.
  const users: string[] = [];
  const allowedEmojiNames = new Set(
    allowedEmojis.filter(e => e !== reaction.emoji.name)
  );

  reaction.message.reactions.cache.forEach(r => {
    if (allowedEmojiNames.has(r.emoji.name)) {
      users.push(...r.users.cache.keyArray());
    }
  });

  // Remove duplicates
  const uniqueUsers = new Set(users);

  // Check if the user has already reacted to the message with another "upvote" emoji
  if (uniqueUsers.has(user.id)) {
    return;
  }

  // Give the user a point
  await pointHandler(reaction.message.member.id, reaction.message, user.id);
};

export default handleHelpfulRole;
