import type { PostConfirmationTriggerHandler } from 'aws-lambda';

export const handler: PostConfirmationTriggerHandler = async (event) => {
  // Logic to create profile record in Aurora goes here
  console.log('Post-confirmation triggered for', event.userName);
  return event;
};
