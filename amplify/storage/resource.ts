import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'OurWeddingStorage',
  access: (allow) => ({
    'gallery/*': [
      allow.groups(['admin', 'planner']).to(['read', 'write', 'delete']),
      allow.guest.to(['write'])
    ],
    'assets/*': [
      allow.groups(['admin', 'planner']).to(['read', 'write', 'delete']),
      allow.groups(['vendor']).to(['read'])
    ],
    'exports/*': [
      allow.groups(['admin', 'planner']).to(['read', 'delete'])
    ]
  })
});
