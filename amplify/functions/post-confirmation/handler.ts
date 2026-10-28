import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});

/**
 * Self-service sign-ups are couples managing their own wedding, so they go in the "planner"
 * group, which grants dashboard access. Data access is isolated per wedding by `owners`, so this
 * group grants nothing across tenants. "admin" is reserved for platform staff and is never
 * assigned automatically.
 */
export const handler: PostConfirmationTriggerHandler = async (event) => {
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') return event;
  await cognito.send(new AdminAddUserToGroupCommand({
    UserPoolId: event.userPoolId,
    Username: event.userName,
    GroupName: 'planner',
  }));
  return event;
};
