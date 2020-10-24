import { Document, Model, model, Schema } from 'mongoose';

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

export const GenericCache = model('GenericCache', schema) as Model<
  Document & {
    guild: string;
    type: string;
    timestamp: number;
    usre: string;
    meta?: unknown;
  }
>;
