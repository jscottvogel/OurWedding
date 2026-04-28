import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient, ScanCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import * as fs from 'fs';

async function check() {
  const amplifyOutputs = JSON.parse(fs.readFileSync('./amplify_outputs.json', 'utf-8'));
  const userPoolId = amplifyOutputs.auth.user_pool_id;
  const region = amplifyOutputs.auth.aws_region;

  // Check Cognito Users
  console.log("=== COGNITO USERS ===");
  const cognitoClient = new CognitoIdentityProviderClient({ region });
  try {
    const { Users } = await cognitoClient.send(new ListUsersCommand({ UserPoolId: userPoolId }));
    Users?.forEach(u => console.log(`- ${u.Username} (Status: ${u.UserStatus})`));
  } catch (e: any) {
    console.error("Failed to list users:", e.message);
  }

  // Find Profile table name
  console.log("\n=== DYNAMODB PROFILES ===");
  const ddbClient = new DynamoDBClient({ region });
  try {
    const { TableNames } = await ddbClient.send(new ListTablesCommand({}));
    const profileTable = TableNames?.find(t => t.includes('Profile'));
    if (profileTable) {
      const { Items } = await ddbClient.send(new ScanCommand({ TableName: profileTable }));
      console.log(`Found ${Items?.length || 0} profiles in ${profileTable}.`);
      Items?.forEach(item => console.log(JSON.stringify(item)));
    } else {
      console.log("Profile table not found.");
    }
  } catch (e: any) {
    console.error("Failed to scan profiles:", e.message);
  }
}

check();
