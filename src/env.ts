import { config } from 'dotenv';
config();

export const IS_PROD = process.env.NODE_ENV === 'production';

export const DUMMY_TOKEN = process.env.DUMMY_TOKEN;
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const REPO_LINK = process.env.REPO_LINK;

export const MOD_CHANNEL = process.env.MOD_CHANNEL;
export const NUMBER_OF_ALLOWED_MESSAGES =
  process.env.NUMBER_OF_ALLOWED_MESSAGES;
export const CACHE_REVALIDATION_IN_SECONDS =
  process.env.CACHE_REVALIDATION_IN_SECONDS;
export const FINAL_CACHE_EXPIRATION_IN_SECONDS =
  process.env.FINAL_CACHE_EXPIRATION_IN_SECONDS;

export const JOB_POSTINGS_CHANNEL = process.env.JOB_POSTINGS_CHANNEL;
export const AWAIT_MESSAGE_TIMEOUT = process.env.AWAIT_MESSAGE_TIMEOUT;
export const MINIMAL_COMPENSATION = process.env.MINIMAL_COMPENSATION;
export const MINIMAL_AMOUNT_OF_WORDS = process.env.MINIMAL_AMOUNT_OF_WORDS;
export const POST_LIMITER_IN_HOURS = process.env.POST_LIMITER_IN_HOURS;
