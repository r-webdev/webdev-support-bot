import { Schema, model } from 'mongoose';

const schema = new Schema({
  guild: {
    required: true,
    type: String,
  },
  points: {
    default: 0,
    type: Number,
  },
  user: {
    required: true,
    type: String,
  },
});

export default model('helpfulRoleMember', schema);
