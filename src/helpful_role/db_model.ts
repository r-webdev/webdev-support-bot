import { Schema, model } from 'mongoose';

const schema = new Schema({
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
