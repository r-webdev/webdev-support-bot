export const ENV = process.env.NODE_ENV || 'development';
export const IS_PROD = process.env.NODE_ENV === 'production';

export const SERVER_ID = IS_PROD ? '434487340535382016' : process.env.SERVER_ID;

export const { DUMMY_TOKEN } = process.env;
export const { DISCORD_TOKEN } = process.env;
export const { REPO_LINK } = process.env;

export const { MOD_CHANNEL } = process.env;
export const { NUMBER_OF_ALLOWED_MESSAGES } = process.env;
export const { CACHE_REVALIDATION_IN_SECONDS } = process.env;
export const { FINAL_CACHE_EXPIRATION_IN_SECONDS } = process.env;

export const { JOB_POSTINGS_CHANNEL } = process.env;
export const { AWAIT_MESSAGE_TIMEOUT } = process.env;
export const { MINIMAL_COMPENSATION } = process.env;
export const { MINIMAL_AMOUNT_OF_WORDS } = process.env;
export const { POST_LIMITER_IN_HOURS } = process.env;

export const { API_CACHE_ENTRIES_LIMIT } = process.env;
export const { API_CACHE_EXPIRATION_IN_SECONDS } = process.env;
export const { API_CACHE_REVALIDATION_WINDOW_IN_SECONDS } = process.env;

export const { MONGO_URI } = process.env;
export const { HELPFUL_ROLE_ID } = process.env;
export const { HELPFUL_ROLE_EXEMPT_ID } = process.env;
export const { HELPFUL_ROLE_POINT_THRESHOLD } = process.env;
export const { POINT_DECAY_TIMER } = process.env;
export const { ADMIN_ROLE_ID } = process.env;
export const { MOD_ROLE_ID } = process.env;

export const { POINT_LIMITER_IN_MINUTES } = process.env;
export const VAR_DETECT_LIMIT =
  Number.parseInt(process.env.VAR_DETECT_LIMIT) || 1_800_000;

export const JUST_ASK_DETECT_LIMIT =
  Number.parseInt(process.env.JUST_ASK_DETECT_LIMIT) || 86_400_000;

export const { NEW_USER_ROLE } = process.env;
export const { ONBOARDING_CHANNEL } = process.env;
export const { JOIN_LOG_CHANNEL } = process.env;
export const { INTRO_CHANNEL } = process.env;
export const { INTRO_ROLE } = process.env;

export const { REPEL_ROLE_ID } = process.env;
export const REPEL_DELETE_COUNT =
  Number.parseInt(process.env.REPEL_DELETE_COUNT) || 2;
export const { REPEL_LOG_CHANNEL_ID } = process.env;
