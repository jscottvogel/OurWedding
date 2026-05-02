import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from '../functions/post-confirmation/resource';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  senders: {
    email: {
      fromEmail: 'hello@weddingsteward.com',
      fromName: 'Wedding Steward',
      replyTo: 'hello@weddingsteward.com',
    },
  },
  userAttributes: {
    "custom:role": {
      dataType: "String",
      mutable: true,
    },
    "custom:wedding_id": {
      dataType: "String",
      mutable: true,
    },
    "custom:vendor_id": {
      dataType: "String",
      mutable: true,
    },
  },
  groups: ["admin", "planner", "vendor"],
  multifactor: {
    mode: "OPTIONAL",
    totp: true,
  },
  triggers: {
    postConfirmation,
  },
});
