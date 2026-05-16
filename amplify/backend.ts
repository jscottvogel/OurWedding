import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { qrGenerate } from './functions/qr-generate/resource';
import { pdfExport } from './functions/pdf-export/resource';
import { sendEmail } from './functions/send-email/resource';
import { postConfirmation } from './functions/post-confirmation/resource';
import { askIvy } from './functions/ask-ivy/resource';
import { removeUser } from './functions/remove-user/resource';
import { resetDemo } from './functions/reset-demo/resource';
import { sendWeddingEmail } from './functions/send-wedding-email/resource';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

const backend = defineBackend({
  auth,
  data,
  storage,
  qrGenerate,
  pdfExport,
  sendEmail,
  postConfirmation,
  askIvy,
  removeUser,
  resetDemo,
  sendWeddingEmail,
});

const bucket = backend.storage.resources.bucket as s3.Bucket;
bucket.addCorsRule({
  allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE, s3.HttpMethods.HEAD],
  allowedOrigins: ['*'],
  allowedHeaders: ['*'],
  exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
  maxAge: 3000,
});

backend.askIvy.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: [
      'arn:aws:bedrock:*::foundation-model/*',
      'arn:aws:bedrock:*:*:inference-profile/*'
    ],
  })
);

backend.askIvy.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [`${backend.storage.resources.bucket.bucketArn}/chat/*`],
  })
);

backend.askIvy.addEnvironment('STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);

backend.sendEmail.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'cognito-idp:AdminCreateUser',
      'cognito-idp:AdminAddUserToGroup'
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

backend.sendEmail.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

backend.removeUser.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['cognito-idp:AdminDeleteUser'],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

backend.removeUser.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

backend.sendWeddingEmail.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'ses:SendEmail',
      'ses:SendBulkTemplatedEmail'
    ],
    resources: ['*'], // For SES, typically '*' is needed unless specifically scoped to identities
  })
);

// Grant DynamoDB access
backend.sendWeddingEmail.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [
      backend.data.resources.tables['Wedding'].tableArn,
      backend.data.resources.tables['EmailCampaign'].tableArn,
      backend.data.resources.tables['EmailSendRecord'].tableArn,
      backend.data.resources.tables['Wedding'].tableArn + '/index/*',
      backend.data.resources.tables['EmailCampaign'].tableArn + '/index/*',
      backend.data.resources.tables['EmailSendRecord'].tableArn + '/index/*'
    ],
  })
);

backend.sendWeddingEmail.addEnvironment('TABLE_WEDDING', backend.data.resources.tables['Wedding'].tableName);
backend.sendWeddingEmail.addEnvironment('TABLE_EMAIL_CAMPAIGN', backend.data.resources.tables['EmailCampaign'].tableName);
backend.sendWeddingEmail.addEnvironment('TABLE_EMAIL_SEND_RECORD', backend.data.resources.tables['EmailSendRecord'].tableName);

// Grant DynamoDB access for resetDemo
backend.resetDemo.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:DeleteItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [
      backend.data.resources.tables['Wedding'].tableArn,
      backend.data.resources.tables['Guest'].tableArn,
      backend.data.resources.tables['Vendor'].tableArn,
      backend.data.resources.tables['BudgetItem'].tableArn,
      backend.data.resources.tables['RunSheetItem'].tableArn,
      backend.data.resources.tables['Wedding'].tableArn + '/index/*',
      backend.data.resources.tables['Guest'].tableArn + '/index/*',
      backend.data.resources.tables['Vendor'].tableArn + '/index/*',
      backend.data.resources.tables['BudgetItem'].tableArn + '/index/*',
      backend.data.resources.tables['RunSheetItem'].tableArn + '/index/*'
    ],
  })
);

backend.resetDemo.addEnvironment('TABLE_WEDDING', backend.data.resources.tables['Wedding'].tableName);
backend.resetDemo.addEnvironment('TABLE_GUEST', backend.data.resources.tables['Guest'].tableName);
backend.resetDemo.addEnvironment('TABLE_VENDOR', backend.data.resources.tables['Vendor'].tableName);
backend.resetDemo.addEnvironment('TABLE_BUDGET_ITEM', backend.data.resources.tables['BudgetItem'].tableName);
backend.resetDemo.addEnvironment('TABLE_RUN_SHEET_ITEM', backend.data.resources.tables['RunSheetItem'].tableName);
