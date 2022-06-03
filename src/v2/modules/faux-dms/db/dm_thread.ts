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
}, {
  timestamps: true
});

export const DMThread = model<DMThreadType>('dmThread', schema);
export type DMThreadType = {
  guildId: string,
  threadId: string,
  channelId: string,
  userId: string,
  createdAt: Date,
  updatedAt: Date
};
