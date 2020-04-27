const isNotEmpty = (s: string): boolean =>
  !s || s.trim().length == 0 ? false : true;

const { MINIMAL_COMPENSATION } = process.env;

export default {
  remote: {
    body: 'Is your position remote? `Yes/No`',
    validate: (answer) => {
      const acceptableResults = ['yes', 'no'];
      return acceptableResults.includes(answer.toLowerCase());
    },
  },
  location: {
    body:
      'Please, in a single message, provide a location if you can.\nIf you do not wish to reveal the location, answer simply with `no`',
    validate: isNotEmpty,
  },
  description: {
    body:
      'Please, in a single message, provide a short description of the job.\nIt may include details such as hours and languages/frameworks/specific tooling (such as JS, PHP, Wordpress, etc.).',
    validate: isNotEmpty,
  },
  compensation: {
    body:
      'Please provide the amount that you are willing to pay for the project in USD `$`.\nPlease be precise. Do not include anything else besides the amount, with or without the dollar sign.',
    validate: (answer) => {
      const val = answer.split('$').join(''),
        regex = /^[0-9]+(\.[0-9]{1,2})?$/gm;

      const floatVal = parseFloat(val);
      return (
        regex.test(floatVal.toFixed(2)) &&
        floatVal >= parseFloat(MINIMAL_COMPENSATION)
      );
    },
  },
  notes: {
    body:
      'Almost done!\nAny further notes? E.g. contact information (DM, mail, other channels).',
  },
};
