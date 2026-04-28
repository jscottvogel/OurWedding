import type { AppSyncResolverHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler: AppSyncResolverHandler<{ email: string; role: string; weddingId: string }, boolean> = async (event) => {
  const { email, role, weddingId } = event.arguments;
  const userPoolId = process.env.USER_POOL_ID;

  if (!userPoolId) {
    throw new Error('USER_POOL_ID environment variable is missing.');
  }

  try {
    console.log(`Inviting user ${email} with role ${role} to wedding ${weddingId}...`);
    
    // 1. Create the user in Cognito (this automatically sends the temporary password email)
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
        { Name: "custom:wedding_id", Value: weddingId },
        { Name: "custom:role", Value: role },
      ],
      DesiredDeliveryMediums: ["EMAIL"],
    });
    
    await client.send(createCommand);
    
    // 2. Add the user to the correct Cognito Group based on their role
    // Valid groups based on auth/resource.ts: "admin", "planner", "vendor"
    let groupName = role;
    if (!["admin", "planner", "vendor"].includes(groupName)) {
        // Default to planner if something else was passed
        groupName = "planner";
    }

    const addGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: email,
      GroupName: groupName,
    });

    await client.send(addGroupCommand);

    console.log(`Successfully invited ${email} and added to group ${groupName}.`);
    return true;
  } catch (error: any) {
    if (error.name === 'UsernameExistsException') {
      console.log(`User ${email} already exists in Cognito. Proceeding anyway.`);
      return true;
    }
    console.error('Failed to invite user:', error);
    throw new Error('Failed to invite user');
  }
};
