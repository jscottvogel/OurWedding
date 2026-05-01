import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendEmail } from '../functions/send-email/resource';
import { pdfExport } from '../functions/pdf-export/resource';
import { askIvy } from '../functions/ask-ivy/resource';
import { removeUser } from '../functions/remove-user/resource';

const schema = a.schema({
  Wedding: a
    .model({
      slug: a.string().required(),
      coupleName1: a.string().required(),
      coupleName2: a.string().required(),
      weddingDate: a.date().required(),
      venueName: a.string(),
      heroImageKey: a.string(),
      budgetTotal: a.float(),
      qrCodeUrl: a.string(),
      mealOptions: a.string().array(),
      isActive: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('slug')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.groups(['vendor']).to(['read']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  WeddingMember: a
    .model({
      profileId: a.string().required(),
      weddingId: a.string().required(),
      role: a.enum(['admin', 'planner', 'vendor', 'guest']),
    })
    .secondaryIndexes((index) => [index('profileId'), index('weddingId')])
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.groups(['admin']).to(['read', 'create', 'update', 'delete']),
      allow.authenticated().to(['read']) // Needs fine-grained auth eventually
    ]),

  Profile: a
    .model({
      cognitoSub: a.string().required(),
      fullName: a.string(),
      email: a.string(),
      vendorId: a.string(),
    })
    .secondaryIndexes((index) => [index('cognitoSub')])
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.groups(['admin']).to(['read']),
    ]),

  Vendor: a
    .model({
      weddingId: a.string().required(),
      category: a.string(),
      companyName: a.string(),
      contactPerson: a.string(),
      email: a.string(),
      phone: a.string(),
      website: a.string(),
      address: a.string(),
      notes: a.string(),
      contractStatus: a.enum(['NOT_STARTED', 'SENT', 'SIGNED']),
      contractFileKey: a.string(),
      quotedAmount: a.float(),
      depositAmount: a.float(),
      depositDueDate: a.date(),
      balanceDueDate: a.date(),
      depositPaid: a.boolean().default(false),
      balancePaid: a.boolean().default(false),
      portalAccess: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      // vendor role can read their own via a custom filter or auth rule
      allow.groups(['vendor']).to(['read']),
    ]),

  ChecklistItem: a
    .model({
      weddingId: a.string().required(),
      category: a.enum([
        'TWELVE_MONTHS', 'SIX_MONTHS', 'THREE_MONTHS', 'ONE_MONTH',
        'TWO_WEEKS', 'ONE_WEEK', 'DAY_BEFORE', 'DAY_OF'
      ]),
      title: a.string().required(),
      description: a.string(),
      assignedTo: a.string(),
      notes: a.string(),
      isTemplate: a.boolean().default(false),
      isCompleted: a.boolean().default(false),
      completedAt: a.datetime(),
      dueDate: a.date(),
      sortOrder: a.integer(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  RunSheetItem: a
    .model({
      weddingId: a.string().required(),
      eventTime: a.time().required(),
      durationMinutes: a.integer(),
      title: a.string().required(),
      description: a.string(),
      location: a.string(),
      assignedPerson: a.string(),
      notes: a.string(),
      assignedVendorIds: a.string().array(),
      sortOrder: a.integer(),
      itemType: a.enum(['START', 'END', 'EVENT']),
      mode: a.string(),
      isFixed: a.boolean(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.groups(['vendor']).to(['read']),
    ]),

  GalleryUpload: a
    .model({
      weddingId: a.string().required(),
      uploaderName: a.string().required(),
      fileKey: a.string().required(),
      fileType: a.string(),
      fileSizeBytes: a.integer(),
      thumbnailKey: a.string(),
      caption: a.string(),
      uploadedAt: a.datetime(),
      isDeleted: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create']),
      allow.publicApiKey().to(['create']),
    ]),

  Guest: a
    .model({
      weddingId: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string(),
      email: a.string(),
      phone: a.string(),
      mealChoice: a.string(),
      dietaryOther: a.string(),
      messageToCouple: a.string(),
      notes: a.string(),
      rsvpStatus: a.enum(['PENDING', 'CONFIRMED', 'DECLINED', 'MAYBE']),
      attendingCount: a.integer().default(1),
      dietaryVegetarian: a.boolean(),
      dietaryVegan: a.boolean(),
      dietaryGlutenFree: a.boolean(),
      dietaryNutFree: a.boolean(),
      tableId: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create']),
      allow.publicApiKey().to(['create']),
    ]),

  SeatingTable: a
    .model({
      weddingId: a.string().required(),
      tableName: a.string(),
      shape: a.enum(['ROUND', 'RECTANGLE', 'HEAD']),
      seatCount: a.integer(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  BudgetItem: a
    .model({
      weddingId: a.string().required(),
      category: a.string(),
      description: a.string(),
      vendorId: a.string(),
      estimatedCost: a.float(),
      actualCost: a.float(),
      notes: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  MoodBoard: a
    .model({
      weddingId: a.string().required(),
      title: a.string().required(),
      shareToken: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId'), index('shareToken')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  MoodPin: a
    .model({
      moodBoardId: a.string().required(),
      imageKey: a.string(),
      sourceUrl: a.string(),
      title: a.string(),
      notes: a.string(),
      tags: a.string().array(),
    })
    .secondaryIndexes((index) => [index('moodBoardId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  getWeddingBySlug: a
    .query()
    .arguments({ slug: a.string() })
    .returns(a.ref('Wedding'))
    .authorization((allow) => [allow.guest(), allow.publicApiKey()])
    .handler(a.handler.function('')), // Placeholder until custom resolver defined
    
  exportPDF: a
    .mutation()
    .arguments({ type: a.string(), weddingId: a.string() })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(pdfExport)),

  inviteUser: a
    .mutation()
    .arguments({ email: a.string(), role: a.string(), weddingId: a.string() })
    .returns(a.boolean())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(sendEmail)),

  removeUser: a
    .mutation()
    .arguments({ email: a.string() })
    .returns(a.boolean())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(removeUser)),

  getMoodBoardByShareToken: a
    .query()
    .arguments({ token: a.string() })
    .returns(a.ref('MoodBoard'))
    .authorization((allow) => [allow.guest(), allow.publicApiKey()])
    .handler(a.handler.function('')),

  askIvy: a
    .mutation()
    .arguments({ message: a.string(), weddingContext: a.string(), conversationHistory: a.string() })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(askIvy)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
