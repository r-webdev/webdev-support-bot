import {
  IS_PROD,
  
  
  
  POST_LIMITER_IN_HOURS, // Used for informing the user about the limiter
  AWAIT_MESSAGE_TIMEOUT as AMT, // Renamed for shadowing
  MINIMAL_AMOUNT_OF_WORDS as MAOW, // Renamed for shadowing as well
} from '../../env.js';

// seconds to ms
const AWAIT_MESSAGE_TIMEOUT = Number.parseInt(AMT) * 1000;

// convert hours into seconds (H*60*60)
const POST_LIMITER = IS_PROD
  ? Number.parseInt(POST_LIMITER_IN_HOURS) * 3600
  : 0.01 * 3600; // Shorten limiter to 30 seconds for development purposes

// convert string to int
const MINIMAL_AMOUNT_OF_WORDS = Number.parseInt(MAOW);

export {
  
  
  
  MINIMAL_AMOUNT_OF_WORDS,
  POST_LIMITER,
  
  AWAIT_MESSAGE_TIMEOUT,
};

export {MOD_CHANNEL, JOB_POSTINGS_CHANNEL, MINIMAL_COMPENSATION, POST_LIMITER_IN_HOURS} from '../../env.js';