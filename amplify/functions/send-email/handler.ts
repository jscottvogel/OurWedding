import type { AppSyncResolverHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getWeddingOwners, grantWeddingAccess } from '../shared/owners';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const client = new CognitoIdentityProviderClient({});

const subFrom = (attrs?: { Name?: string; Value?: string }[]) => attrs?.find((a) => a.Name === 'sub')?.Value;

export const handler: AppSyncResolverHandler<{ email: string; role: string; weddingId: string }, boolean> = async (event) => {
  const { email, role, weddingId } = event.arguments;
  const userPoolId = process.env.USER_POOL_ID;
  const callerSub = (event.identity as any)?.sub as string | undefined;

  if (!userPoolId) {
    throw new Error('USER_POOL_ID environment variable is missing.');
  }
  if (!email || !weddingId || !callerSub) {
    throw new Error('email and weddingId are required');
  }

  // Only an owner of the wedding can invite collaborators to it.
  const wedding = await getWeddingOwners(process.env.TABLE_WEDDING!, weddingId);
  if (!wedding || !(wedding.owners || []).includes(callerSub)) {
    throw new Error('Unauthorized');
  }

  // Never allow privilege escalation into the global "admin" group via invites.
  const groupName = role === 'vendor' ? 'vendor' : 'planner';

  let inviteeSub: string | undefined;
  try {
    const created = await client.send(new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
      DesiredDeliveryMediums: ["EMAIL"],
    }));
    inviteeSub = subFrom(created.User?.Attributes);
    await client.send(new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: email, GroupName: groupName }));
  } catch (error: any) {
    if (error.name !== 'UsernameExistsException') {
      console.error('Failed to invite user:', error?.name);
      throw new Error('Failed to invite user');
    }
    // Existing users keep their current groups. We only grant wedding-level access.
  }

  if (!inviteeSub) {
    const existing = await client.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }));
    inviteeSub = subFrom(existing.UserAttributes);
  }
  if (!inviteeSub) throw new Error('Failed to resolve invited user');

  await grantWeddingAccess(weddingId, inviteeSub, groupName === 'vendor' ? 'readers' : 'owners');

  // Record the membership with the invitee's real sub. (Invitees can't read or claim an
  // `INVITE_<email>` placeholder under owner-only auth, so it's created here, server-side.)
  const memberTable = process.env.TABLE_WEDDING_MEMBER!;
  const existing = await doc.send(new ScanCommand({
    TableName: memberTable,
    FilterExpression: 'weddingId = :w AND profileId = :p',
    ExpressionAttributeValues: { ':w': weddingId, ':p': inviteeSub },
  }));
  if (!existing.Items?.length) {
    const refreshed = await getWeddingOwners(process.env.TABLE_WEDDING!, weddingId);
    const owners = Array.from(new Set([...(refreshed?.owners || []), inviteeSub]));
    const now = new Date().toISOString();
    await doc.send(new PutCommand({
      TableName: memberTable,
      Item: {
        id: randomUUID(),
        __typename: 'WeddingMember',
        weddingId,
        profileId: inviteeSub,
        role: role === 'vendor' ? 'vendor' : role === 'admin' ? 'admin' : 'planner',
        owners,
        createdAt: now,
        updatedAt: now,
      },
    }));
  }
  return true;
};
