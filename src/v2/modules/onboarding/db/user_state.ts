import type { Document } from 'mongoose';
import mongoose from 'mongoose';

const { model, Schema } = mongoose;
const schema = new Schema(
  {
    guild: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    rolesOnLeave: {
      type: [
        {
          name: String,
          id: String,
        },
      ],
    },
    rulesAgreedDate: {
      type: Date,
    },
    state: {
      type: String,
      required: true,
    },
    threadId: {
      type: String,
    },
  },
  { timestamps: true }
);

export const UserState = model<UserStateType>('user_state', schema);
export type OnboardingState =
  | 'START'
  | 'INTRODUCTION'
  | 'ROLE_SELECTION'
  | 'ONBOARDED';

export type UserStateType = Document & {
  guild: string;
  userId: string;
  rulesAgreedDate?: Date;
  rolesOnLeave?: { name: string; id: string }[];
  state: OnboardingState;
  threadId?: string;
  createdAt: Date;
  updatedAt: Date;
};
