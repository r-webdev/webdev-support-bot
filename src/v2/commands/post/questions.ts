import { MINIMAL_COMPENSATION, MINIMAL_AMOUNT_OF_WORDS } from './env';

const isNotEmpty = (str: string): boolean => str.length > 0;

const allowCertainAnswers = (allowed: string[], answer: string): boolean =>
  allowed.includes(answer);

/*
  Since checking if the input string is empty is not practical for this use-case,
  this function checks if the provided input has at the very least `MINIMAL_AMOUNT_OF_WORDS` words in it.
*/
const isNotShort = (str: string): boolean =>
  str.split(' ').length >= MINIMAL_AMOUNT_OF_WORDS;

const questions = new Map(
  Object.entries({
    remote: {
      body:
        'Type `yes` if your position is remote and `no` if it requires a location.',
      validate: (answer: string): boolean =>
        allowCertainAnswers(['yes', 'no'], answer),
    },
    location: {
      body:
        'Provide the location in a single message. If you wish not to share the location reply with `no`.',
      validate: isNotEmpty,
    },
    description: {
      body:
        'With a single message provide a short description of the job.\nTypically job postings include a description of the job, estimated hours, technical knowledge requirements, scope, and desired qualifications.',
      validate: isNotShort,
    },
    compensation_type: {
      body:
        'Type `project` if your compensation amount is for the project or type `hourly` if your compensation amount is for an hourly rate.',
      validate: (answer: string): boolean =>
        allowCertainAnswers(['project', 'hourly'], answer),
    },
    compensation: {
      body:
        'Provide the compensation amount for this job using **only** numbers.',
      validate: (answer: string): boolean => {
        const value = Number.parseFloat(answer.split('$').join(''));
        const minimalCompensation = Number.parseFloat(MINIMAL_COMPENSATION);
        return !Number.isNaN(value) && value >= minimalCompensation;
      },
    },
    contact: {
      body:
        'Provide the method that applicants should apply for your job (e.g., DM, email, website application, etc.) and any additional information that you think would be helpful to potential applicants.',
      validation: isNotEmpty,
    },
  })
);

export default questions;
