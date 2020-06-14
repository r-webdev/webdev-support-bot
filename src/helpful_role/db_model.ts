import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: Schema.Types.ObjectId,
  points: {
    default: 0,
    type: Number,
  },
  user: {
    required: true,
    type: Number,
  },
});

export default model('helpfulRoleMember', schema, 'helpful-role-members');
