import type { Document } from 'mongoose';
import mongoose from 'mongoose'

const { model, Schema } = mongoose


const schema = new Schema({
  guild: {
    required: true,
    type: String
  },
  channel: {
    required: true,
    type: String
  },
  thanker: {
    required: true,
    type: String
  },
  thankees: {
    type: [String],
    required: true
  },
  responseMsgId: {
    type: String
  }
}, {
  timestamps: true
})

export const ThanksInteraction = model('thanksMessageInteraction', schema)
export type ThanksInteractionType = Document & {
  guild: string,
  thanker: string,
  channel: string,
  thankees: string[],
  responseMsgId: string,
  createdAt: Date,
  updatedAt: Date
};
