import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { qrGenerate } from './functions/qr-generate/resource';
import { pdfExport } from './functions/pdf-export/resource';
import { sendEmail } from './functions/send-email/resource';
import { postConfirmation } from './functions/post-confirmation/resource';
import { askIvy } from './functions/ask-ivy/resource';
import * as iam from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  storage,
  qrGenerate,
  pdfExport,
  sendEmail,
  postConfirmation,
  askIvy,
});

backend.askIvy.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:*::foundation-model/us.anthropic.claude-haiku-4-5-20251001-v1:0'],
  })
);

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
