import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendEmail } from '../functions/send-email/resource';
import { pdfExport } from '../functions/pdf-export/resource';
import { askIvy } from '../functions/ask-ivy/resource';
import { removeUser } from '../functions/remove-user/resource';
import { resetDemo } from '../functions/reset-demo/resource';
import { sendWeddingEmail } from '../functions/send-wedding-email/resource';

const schema = a.schema({
  SendEmailResult: a.customType({
    campaignId: a.id(),
    sentCount: a.integer(),
    failedCount: a.integer(),
    errors: a.string().array(),
  }),
  Wedding: a
    .model({
      slug: a.string().required(),
      coupleName1: a.string().required(),
      coupleName2: a.string().required(),
      weddingDate: a.date().required(),
      weddingTime: a.time(),
      venueName: a.string(),
      venueAddress: a.string(),
      heroImageKey: a.string(),
      timezone: a.string(),
      budgetTotal: a.float(),
      qrCodeUrl: a.string(),
      mealOptions: a.string().array(),
      isActive: a.boolean().default(true),
      websiteEnabled: a.boolean().default(false),
      rsvpDeadline: a.date(),
      rsvpMealOptions: a.string().array(),
      rsvpCustomQuestions: a.string(),
      rsvpConfirmationMsg: a.string(),
      spotifyEmbedUrl: a.string(),
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
      allow.authenticated().to(['read']),
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
      allow.publicApiKey().to(['read']),
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
      itemType: a.enum(['START', 'END', 'EVENT', 'MILESTONE', 'GUESTS_ARRIVE']),
      mode: a.string(),
      isFixed: a.boolean(),
      isPublic: a.boolean().default(false),
      venuePhotoUrl: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.groups(['vendor']).to(['read']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),

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
      showOnWebsite: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create']),
      allow.publicApiKey().to(['read', 'create']),
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
      tags: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create', 'read', 'update']),
      allow.publicApiKey().to(['create', 'read', 'update']),

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

  WebsiteConfig: a
    .model({
      weddingId: a.string().required(),
      publishStatus: a.enum(['DRAFT', 'PUBLISHED', 'POST_WEDDING']),
      subdomain: a.string().required(),
      customDomain: a.string(),
      passwordProtected: a.boolean().default(false),
      sitePassword: a.string(),
      siteTitle: a.string(),
      metaDescription: a.string(),
      ogImageUrl: a.string(),
      siteLogoType: a.enum(['TEXT_ONLY', 'STEWARD', 'RINGS', 'CROSS', 'DOVE', 'HEART', 'CUSTOM']),
      siteLogoKey: a.string(),
      themeId: a.string().required(),
      primaryColor: a.string().required(),
      accentColor: a.string().required(),
      backgroundColor: a.string().required(),
      headingFont: a.string().required(),
      bodyFont: a.string().required(),
      buttonStyle: a.enum(['ROUNDED', 'SQUARE', 'PILL']),
      sectionOrder: a.string().required(),
      enabledSections: a.string().required(),
      customCss: a.string(),
      customJs: a.string(),
      headInjection: a.string(),
      viewCount: a.integer().default(0),
    })
    .secondaryIndexes((index) => [index('weddingId'), index('subdomain')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read', 'update']), // Allow guest to update viewCount
      allow.publicApiKey().to(['read', 'update']),
    ]),

  WebsiteAnalytics: a
    .model({
      weddingId: a.string().required(),
      dateString: a.string().required(),
      views: a.integer().default(0),
      uniqueVisitors: a.integer().default(0),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create', 'read', 'update']),
      allow.publicApiKey().to(['create', 'read', 'update']),
    ]),

  WebsiteStory: a
    .model({
      weddingId: a.string().required(),
      coupleStory: a.string(),
      storyImageKey: a.string(),
      howWeMetDate: a.date(),
      engagementDate: a.date(),
      engagementStory: a.string(),
      milestones: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  WebsiteTravel: a
    .model({
      weddingId: a.string().required(),
      hotelName: a.string().required(),
      address: a.string(),
      bookingUrl: a.string(),
      roomBlockCode: a.string(),
      blockDeadline: a.date(),
      distanceFromVenue: a.string(),
      priceRange: a.string(),
      notes: a.string(),
      displayOrder: a.integer().default(0),
      isVisible: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  WebsitePartyMember: a
    .model({
      weddingId: a.string().required(),
      name: a.string().required(),
      role: a.string().required(),
      bio: a.string(),
      photoUrl: a.string(),
      displayOrder: a.integer().default(0),
      isVisible: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  WebsiteRegistry: a
    .model({
      weddingId: a.string().required(),
      registryName: a.string().required(),
      registryUrl: a.string().required(),
      logoUrl: a.string(),
      imageKey: a.string(),
      description: a.string(),
      isCashFund: a.boolean().default(false),
      displayOrder: a.integer().default(0),
      isVisible: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  WebsiteFaq: a
    .model({
      weddingId: a.string().required(),
      question: a.string().required(),
      answer: a.string().required(),
      category: a.string(),
      displayOrder: a.integer().default(0),
      isVisible: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['read']),
      allow.publicApiKey().to(['create', 'read']),
    ]),

  WebsiteGuestbook: a
    .model({
      weddingId: a.string().required(),
      guestName: a.string().required(),
      message: a.string(),
      songRequest: a.string(),
      messageType: a.enum(['GUESTBOOK', 'SONG_REQUEST', 'BOTH']),
      mediaKey: a.string(),
      mediaType: a.string(),
      isApproved: a.boolean().default(true),
      isDeleted: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
      allow.guest().to(['create', 'read']),
      allow.publicApiKey().to(['create', 'read']),
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
    .arguments({ 
      message: a.string(), 
      weddingContext: a.string(), 
      conversationHistory: a.string(),
      imageBase64: a.string(),
      documentKey: a.string()
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(askIvy)),

  EmailCampaign: a
    .model({
      weddingId: a.string().required(),
      emailType: a.enum(['save_the_date', 'invitation', 'rsvp_reminder', 'event_reminder_1', 'event_reminder_2', 'thank_you']),
      subjectLine: a.string(),
      paletteKey: a.enum(['classic', 'sage', 'navy', 'dusty_rose']),
      personalNote: a.string(),
      customContent: a.string(),
      photoUrl: a.string(),
      galleryUrl: a.string(),
      guestbookUrl: a.string(),
      overrideNames: a.string(),
      scheduledAt: a.datetime(),
      sentAt: a.datetime(),
      status: a.enum(['draft', 'sent', 'scheduled', 'failed']),
      sentCount: a.integer().default(0),
      failedCount: a.integer().default(0),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  EmailSendRecord: a
    .model({
      campaignId: a.string().required(),
      weddingId: a.string().required(),
      guestId: a.string(),
      recipientEmail: a.string().required(),
      recipientName: a.string(),
      status: a.enum(['queued', 'sent', 'failed', 'bounced', 'opened']),
      sesMessageId: a.string(),
      sentAt: a.datetime(),
      errorMessage: a.string(),
    })
    .secondaryIndexes((index) => [index('campaignId'), index('weddingId')])
    .authorization((allow) => [
      allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]),

  sendWeddingEmail: a
    .mutation()
    .arguments({
      campaignId: a.id().required(),
      recipientEmails: a.string().array(),
      guestIds: a.id().array(),
      emailType: a.string().required(),
      subjectLine: a.string().required(),
      paletteKey: a.string().required(),
      personalNote: a.string(),
      customContent: a.string(),
      photoUrl: a.string(),
      galleryUrl: a.string(),
      guestbookUrl: a.string(),
      overrideNames: a.string(),
      isTest: a.boolean(),
    })
    .returns(a.ref('SendEmailResult'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(sendWeddingEmail)),
}).authorization((allow) => [
  allow.resource(resetDemo)
]);

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
