import { REPO_LINK } from '../env';

export const invalidResponse =
  'sorry, your request could not be processed. Please try again at a later time.';
export const noResults = (search: string) =>
  `sorry, could not find anything for \`${search}\`. Autodeleting this response in 30 seconds.`;
export const unknownError = `sorry, something went wrong. If this issue persists, please file an issue at ${REPO_LINK}`;
export const missingRightsDeletion =
  'insufficient permissions: unable to delete message.';
export const userNotFound =
  'sorry, your user ID cannot be found within the database.';
