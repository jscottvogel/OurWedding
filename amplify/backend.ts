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
});

backend.storage.resources.bucket.addCorsRule({
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
