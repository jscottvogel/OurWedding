import type { AppSyncResolverHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler: AppSyncResolverHandler<{ email: string }, boolean> = async (event) => {
  const { email } = event.arguments;
  const userPoolId = process.env.USER_POOL_ID;

  if (!userPoolId) {
    throw new Error('USER_POOL_ID environment variable is missing.');
  }

  try {
    console.log(`Removing user ${email} from Cognito...`);
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });
    
    await client.send(deleteCommand);
    console.log(`Successfully removed ${email}.`);
    return true;
  } catch (error: any) {
    if (error.name === 'UserNotFoundException') {
      console.log(`User ${email} not found in Cognito. Proceeding anyway.`);
      return true;
    }
    console.error('Failed to remove user:', error);
    throw new Error('Failed to remove user');
  }
};
