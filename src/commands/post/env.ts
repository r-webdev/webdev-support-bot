const {
  MOD_CHANNEL,
  JOB_POSTINGS_CHANNEL,
  MINIMAL_COMPENSATION,
  POST_LIMITER_IN_HOURS, // Used for informing the user about the limiter
  AWAIT_MESSAGE_TIMEOUT: AMT, // Renamed for shadowing
  MINIMAL_AMOUNT_OF_WORDS: MAOW, // Renamed for shadowing as well
} = process.env;

// seconds to ms
const AWAIT_MESSAGE_TIMEOUT = parseInt(AMT) * 1000;

// convert hours into seconds (H*60*60)
const POST_LIMITER =
  process.env.NODE_ENV === 'production'
    ? parseInt(POST_LIMITER_IN_HOURS) * 3600
    : 0.01 * 3600; // Shorten limiter to 30 seconds for development purposes

// convert string to int
const MINIMAL_AMOUNT_OF_WORDS = parseInt(MAOW);

export {
  MOD_CHANNEL,
  JOB_POSTINGS_CHANNEL,
  MINIMAL_COMPENSATION,
  MINIMAL_AMOUNT_OF_WORDS,
  POST_LIMITER,
  POST_LIMITER_IN_HOURS,
  AWAIT_MESSAGE_TIMEOUT,
};
