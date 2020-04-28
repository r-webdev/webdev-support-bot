// seconds to ms
const AWAIT_MESSAGE_TIMEOUT =
  parseInt(process.env.AWAIT_MESSAGE_TIMEOUT) * 1000;

// convert hours into seconds (H*60*60)
const POST_LIMITER_IN_HOURS =
  process.env.NODE_ENV === 'production'
    ? parseFloat(process.env.POST_LIMITER_IN_HOURS) * 3600
    : 0.01 * 3600; // Shorten limiter to 30 seconds for development purposes

const { MOD_CHANNEL, JOB_POSTINGS_CHANNEL, MINIMAL_COMPENSATION } = process.env;

export {
  MOD_CHANNEL,
  JOB_POSTINGS_CHANNEL,
  MINIMAL_COMPENSATION,
  POST_LIMITER_IN_HOURS,
  AWAIT_MESSAGE_TIMEOUT,
};
