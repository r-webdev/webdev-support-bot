import { MINIMAL_COMPENSATION } from './env';

const isNotEmpty = (str: string) => str.length > 0;

export default {
  remote: {
    body:
      'Type `yes` if your position is remote and `no` if it requires a location.',
    validate: (answer: string) => ['yes', 'no'].includes(answer),
  },
  location: {
    body:
      'Provide the location in a single message. If you wish not to share the location reply with `no`.',
    validate: isNotEmpty,
  },
  description: {
    body:
      'With a single message provide a short description of the job.\nTypically job postings include a description of the job, estimated hours, technical knowledge requirements, scope, and desired qualifications.',
    validate: isNotEmpty,
  },
  compensation_type: {
    body:
      'Type `project` if your compensation amount is for the project or type `hourly` if your compensation amount is for an hourly rate.',
    validate: (answer: string) => ['project', 'hourly'].includes(answer),
  },
  compensation: {
    body:
      'Provide the compensation amount for this job using **only** numbers.',
    validate: answer => {
      const value = parseFloat(answer.split('$').join(''));
      const minimalCompensation = parseFloat(MINIMAL_COMPENSATION);
      return !isNaN(value) && value >= minimalCompensation;
    },
  },
  notes: {
    body:
      'Provide the method that applicants should apply for your job (e.g., DM, email, website application, etc.) and any additional information that you think would be helpful to potential applicants.',
  },
};
