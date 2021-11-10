import type { Document } from 'mongoose';
import mongoose from 'mongoose';

const { model, Schema } = mongoose

const schema = new Schema({
  guild: {
    type: String,
  },
  name: {
    required: true,
    type: String
  },
  commandId: {
    required: true,
    type: String
  },
  applicationId: {
    required: true,
    type: String
  }
} as const);

export const Command = model<CommandType>('commands', schema);

export type CommandType = Document & { guild?: string, name: string, commandId: string, applicationId: string }
