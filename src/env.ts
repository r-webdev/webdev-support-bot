export const IS_PROD = process.env.NODE_ENV === 'production';

export const SERVER_ID = !IS_PROD
  ? process.env.SERVER_ID
  : '434487340535382016';

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

export const API_CACHE_ENTRIES_LIMIT = process.env.API_CACHE_ENTRIES_LIMIT;
export const API_CACHE_EXPIRATION_IN_SECONDS =
  process.env.API_CACHE_EXPIRATION_IN_SECONDS;
export const API_CACHE_REVALIDATION_WINDOW_IN_SECONDS =
  process.env.API_CACHE_REVALIDATION_WINDOW_IN_SECONDS;

export const MONGO_URI = process.env.MONGO_URI;
export const HELPFUL_ROLE_ID = process.env.HELPFUL_ROLE_ID;
export const HELPFUL_ROLE_POINT_THRESHOLD =
  process.env.HELPFUL_ROLE_POINT_THRESHOLD;
export const POINT_DECAY_TIMER = process.env.POINT_DECAY_TIMER;
export const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;
export const MOD_ROLE_ID = process.env.MOD_ROLE_ID;
