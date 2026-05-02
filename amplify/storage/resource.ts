import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'OurWeddingStorage',
  access: (allow) => ({
    'gallery/*': [
      allow.groups(['admin', 'planner']).to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read', 'write'])
    ],
    'assets/*': [
      allow.groups(['admin', 'planner']).to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.groups(['vendor']).to(['read'])
    ],
    'exports/*': [
      allow.groups(['admin', 'planner']).to(['read', 'delete'])
    ],
    'chat/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ],
    'story/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read'])
    ],
    'logo/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read'])
    ]
  })
});
