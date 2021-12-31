import mongoose from 'mongoose';

const { model, Schema } = mongoose

const schema = new Schema({
  guildId: {
    required: true,
    type: String,
  },
  channelId: {
    required: true,
    type: String
  },
  threadId: {
    required: true,
    type: String,
  },
  userId: {
    required: true,
    type: String,
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export const ModMailThread = model<ModMailThreadType>('modmailThread', schema);
export type ModMailThreadType = {
  guildId: string,
  threadId: string,
  channelId: string,
  userId: string,
  closedAt: Date,
  createdAt: Date,
  updatedAt: Date
};
