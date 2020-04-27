import { AWAIT_MESSAGE_TIMEOUT } from './env';

const isNotEmpty = (str: string) => str.trim().length > 0;

const MINIMAL_COMPENSATION = parseFloat(process.env.MINIMAL_COMPENSATION);
const compensationRegExp = /^[0-9]+(\.[0-9]{1,2})?$/gm;

export default {
  remote: {
    body: 'Is your position remote? `Yes/No`',
    validate: (answer: string) => ['yes', 'no'].includes(answer.toLowerCase()),
  },
  location: {
    body:
      'Please, in a single message, provide a location if you can.\nIf you do not wish to reveal the location, answer simply with `no`',
    validate: isNotEmpty,
  },
  description: {
    body:
      'Please, in a single message, provide a short description of the job.\nIt may include details such as hours and languages/frameworks/specific tooling (such as JS, PHP, Wordpress, etc.).\nI will wait ' +
      AWAIT_MESSAGE_TIMEOUT / 1000 +
      ' seconds.',
    validate: isNotEmpty,
  },
  compensation: {
    body:
      'Please provide the amount that you are willing to pay for the project in USD `$`.\nPlease be precise. Do not include anything else besides the amount, with or without the dollar sign.',
    validate: (answer: string) => {
      const value = parseFloat(answer.split('$').join(''));

      return (
        compensationRegExp.test(value.toFixed(2)) &&
        value >= MINIMAL_COMPENSATION
      );
    },
  },
  notes: {
    body:
      'Almost done!\nAny further notes? E.g. contact information (DM, mail, other channels).',
  },
};
