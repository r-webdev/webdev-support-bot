import {  model, Schema } from 'mongoose';

const schema = new Schema({
  guild: {
    required: true,
    type: String,
  },
  meta: {
    type: Schema.Types.Mixed,
  },
  timestamp: {
    default: Date.now(),
    required: true,
    type: Number,
  },
  type: {
    required: true,
    type: String,
  },
  user: {
    required: true,
    type: String,
  },
});

export const GenericCache = model<{
  guild: string;
  type: string;
  timestamp: number;
  usre: string;
  meta?: unknown;
}>('GenericCache', schema) 