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
