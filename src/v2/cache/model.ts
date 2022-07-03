import mongoose from 'mongoose';

const { model, Schema } = mongoose;

const schema = new Schema({
  guild: {
    required: true,
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    default: Date.now(),
    required: true,
  },
  user: {
    required: true,
    type: String,
  },
  meta: {
    type: Schema.Types.Mixed,
  },
});

export const GenericCache = model<GenericCacheType>('GenericCache', schema);

export type GenericCacheType = {
  guild: string;
  type: string;
  timestamp: number;
  user: string;
  meta?: unknown;
};
