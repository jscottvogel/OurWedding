import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendEmail } from '../functions/send-email/resource';
import { pdfExport } from '../functions/pdf-export/resource';
import { askIvy } from '../functions/ask-ivy/resource';
import { removeUser } from '../functions/remove-user/resource';
import { resetDemo } from '../functions/reset-demo/resource';
import { sendWeddingEmail } from '../functions/send-wedding-email/resource';
import { publicSite } from '../functions/public-site/resource';
import { storageAccess } from '../functions/storage-access/resource';

/**
 * AUTHORIZATION MODEL
 * -------------------
 * Tenant isolation: every wedding-scoped record carries `owners: string[]` holding the
 * Cognito `sub` of every user who may manage that wedding. Rules use
 * `allow.ownersDefinedIn('owners').identityClaim('sub')`.
 *
 * - When a record is created WITHOUT `owners`, AppSync auto-populates it with the caller's sub.
 *   That's correct for single-owner weddings. When collaborators exist, clients should pass
 *   `owners` copied from the parent Wedding (see src/lib/amplify/weddingOwners.ts).
 * - `inviteUser` (send-email Lambda) appends the invitee's sub to `owners` (planner/admin) or
 *   `readers` (vendor) on the Wedding and all of its child records.
 * - `readers` grants read-only access (vendor portal). It's present only on the models that
 *   vendors need to see.
 *
 * Public website: the API key is READ-ONLY and is only granted on models that render the
 * public site. Guest, Vendor, budget, seating, email, and analytics data are never readable
 * with the API key. All public writes (RSVP, guestbook, gallery, page views, password checks)
 * go through the `publicSite` Lambda, which validates input and writes to DynamoDB directly.
 */
const ownerRules = (allow: any) => [allow.ownersDefinedIn('owners').identityClaim('sub')];
const ownerAndReaderRules = (allow: any) => [
  allow.ownersDefinedIn('owners').identityClaim('sub'),
  allow.ownersDefinedIn('readers').identityClaim('sub').to(['read']),
];
const publicReadRules = (allow: any) => [
  allow.ownersDefinedIn('owners').identityClaim('sub'),
  allow.publicApiKey().to(['read']),
];

const schema = a.schema({
  /** Presigned POST returned by createUploadUrl / createGuestUploadUrl. `fields` is a JSON object string. */
  StorageUpload: a.customType({
    key: a.string().required(),
    url: a.string().required(),
    fields: a.string().required(),
    contentType: a.string().required(),
    maxBytes: a.integer().required(),
    expiresAt: a.string().required(),
  }),
  StorageFileUrl: a.customType({
    key: a.string().required(),
    url: a.string(),
  }),
  SendEmailResult: a.customType({
    campaignId: a.id(),
    sentCount: a.integer(),
    failedCount: a.integer(),
    errors: a.string().array(),
  }),

  SiteAccess: a.customType({
    weddingId: a.string(),
    slug: a.string(),
    passwordProtected: a.boolean(),
    publishStatus: a.string(),
  }),

  Wedding: a
    .model({
      owners: a.string().array(),
      readers: a.string().array(),
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
    .secondaryIndexes((index) => [index('slug').name('bySlug')])
    .authorization((allow) => [
      allow.ownersDefinedIn('owners').identityClaim('sub'),
      allow.ownersDefinedIn('readers').identityClaim('sub').to(['read']),
      allow.publicApiKey().to(['read']),
    ]),

  WeddingMember: a
    .model({
      owners: a.string().array(),
      profileId: a.string().required(),
      weddingId: a.string().required(),
      role: a.enum(['admin', 'planner', 'vendor', 'guest']),
    })
    .secondaryIndexes((index) => [index('profileId'), index('weddingId')])
    .authorization((allow) => ownerRules(allow)),

  Profile: a
    .model({
      cognitoSub: a.string().required(),
      fullName: a.string(),
      email: a.string(),
      vendorId: a.string(),
    })
    .secondaryIndexes((index) => [index('cognitoSub')])
    .authorization((allow) => [allow.owner()]),

  Vendor: a
    .model({
      owners: a.string().array(),
      readers: a.string().array(),
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
    .authorization((allow) => ownerAndReaderRules(allow)),

  ChecklistItem: a
    .model({
      owners: a.string().array(),
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
    .authorization((allow) => ownerRules(allow)),

  RunSheetItem: a
    .model({
      owners: a.string().array(),
      readers: a.string().array(),
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
      allow.ownersDefinedIn('owners').identityClaim('sub'),
      allow.ownersDefinedIn('readers').identityClaim('sub').to(['read']),
      // Public site shows items flagged isPublic (client filters). Known limitation: API key can
      // read non-public run-sheet items of any wedding; move to a Lambda query if that matters.
      allow.publicApiKey().to(['read']),
    ]),

  GalleryUpload: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      uploaderName: a.string().required(),
      fileKey: a.string().required(),
      fileType: a.string(),
      fileSizeBytes: a.integer(),
      thumbnailKey: a.string(),
      caption: a.string(),
      uploadedAt: a.datetime(),
      isDeleted: a.boolean().default(false),
      showOnWebsite: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => publicReadRules(allow)),

  GuestTag: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      name: a.string().required(),
      isPublic: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [index('weddingId').name('byWeddingId')])
    .authorization((allow) => publicReadRules(allow)),

  // PII: never readable with the API key. Public RSVP goes through lookupRsvpGuest/submitRsvp.
  Guest: a
    .model({
      owners: a.string().array(),
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
      primaryGuestId: a.string(),
      maxGuests: a.integer().default(1),
      bio: a.string(),
      photoUrl: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId').name('byWeddingId')])
    .authorization((allow) => ownerRules(allow)),

  SeatingTable: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      tableName: a.string(),
      shape: a.enum(['ROUND', 'RECTANGLE', 'HEAD']),
      seatCount: a.integer(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => ownerRules(allow)),

  BudgetItem: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      category: a.string(),
      description: a.string(),
      vendorId: a.string(),
      estimatedCost: a.float(),
      actualCost: a.float(),
      notes: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => ownerRules(allow)),

  // Not API-key readable: shared boards are served by getMoodBoardByShareToken.
  MoodBoard: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      title: a.string().required(),
      shareToken: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId'), index('shareToken').name('byShareToken')])
    .authorization((allow) => ownerRules(allow)),

  MoodPin: a
    .model({
      owners: a.string().array(),
      moodBoardId: a.string().required(),
      imageKey: a.string(),
      sourceUrl: a.string(),
      title: a.string(),
      notes: a.string(),
      tags: a.string().array(),
    })
    .secondaryIndexes((index) => [index('moodBoardId').name('byMoodBoardId')])
    .authorization((allow) => ownerRules(allow)),

  WebsiteConfig: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      publishStatus: a.enum(['DRAFT', 'PUBLISHED', 'POST_WEDDING']),
      subdomain: a.string().required(),
      customDomain: a.string(),
      passwordProtected: a.boolean().default(false),
      // The password hash lives in SitePassword, which only the Lambda writes (via setSitePassword).
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
      partyTags: a.string().array(),
    })
    .secondaryIndexes((index) => [
      index('weddingId').name('byWeddingId'),
      index('subdomain').name('bySubdomain'),
      index('customDomain').name('byCustomDomain'),
    ])
    .authorization((allow) => publicReadRules(allow)),

  SitePassword: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      passwordHash: a.string().required(),
    })
    .authorization((allow) => [allow.ownersDefinedIn('owners').identityClaim('sub').to(['read', 'delete'])]),

  WebsiteAnalytics: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      dateString: a.string().required(),
      views: a.integer().default(0),
      uniqueVisitors: a.integer().default(0),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => ownerRules(allow)),

  WebsiteStory: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      coupleStory: a.string(),
      storyImageKey: a.string(),
      howWeMetDate: a.date(),
      engagementDate: a.date(),
      engagementStory: a.string(),
      milestones: a.string(),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => publicReadRules(allow)),

  WebsiteTravel: a
    .model({
      owners: a.string().array(),
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
    .authorization((allow) => publicReadRules(allow)),

  WebsitePartyMember: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      name: a.string().required(),
      role: a.string().required(),
      bio: a.string(),
      photoUrl: a.string(),
      displayOrder: a.integer().default(0),
      isVisible: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => publicReadRules(allow)),

  WebsiteRegistry: a
    .model({
      owners: a.string().array(),
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
    .authorization((allow) => publicReadRules(allow)),

  WebsiteFaq: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      question: a.string().required(),
      answer: a.string().required(),
      category: a.string(),
      displayOrder: a.integer().default(0),
      isVisible: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => publicReadRules(allow)),

  // Public reads should filter isApproved=true && isDeleted=false. Guests create entries
  // only via submitGuestbookEntry (always isApproved=false).
  WebsiteGuestbook: a
    .model({
      owners: a.string().array(),
      weddingId: a.string().required(),
      guestName: a.string().required(),
      message: a.string(),
      songRequest: a.string(),
      messageType: a.enum(['GUESTBOOK', 'SONG_REQUEST', 'BOTH']),
      mediaKey: a.string(),
      mediaType: a.string(),
      isApproved: a.boolean().default(false),
      isDeleted: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [index('weddingId')])
    .authorization((allow) => publicReadRules(allow)),

  EmailCampaign: a
    .model({
      owners: a.string().array(),
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
    .authorization((allow) => ownerRules(allow)),

  EmailSendRecord: a
    .model({
      owners: a.string().array(),
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
    .authorization((allow) => ownerRules(allow)),

  // ---------------- Public site operations (publicSite Lambda) ----------------
  getWeddingBySlug: a
    .query()
    .arguments({ slug: a.string().required() })
    .returns(a.ref('Wedding'))
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
    .handler(a.handler.function(publicSite)),

  getMoodBoardByShareToken: a
    .query()
    .arguments({ token: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
    .handler(a.handler.function(publicSite)),

  /** Resolve a site by slug or full hostname (custom domain). Non-sensitive; used by middleware. */
  getSiteAccess: a
    .query()
    .arguments({ slug: a.string(), host: a.string() })
    .returns(a.ref('SiteAccess'))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(publicSite)),

  // These four take `internalKey`, a server-only secret, so they're only usable through the
  // Next.js API routes (which handle rate limiting and cookies), not straight from a browser.
  verifySitePassword: a
    .mutation()
    .arguments({ internalKey: a.string().required(), slug: a.string().required(), password: a.string().required() })
    .returns(a.ref('SiteAccess'))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(publicSite)),

  lookupRsvpGuest: a
    .mutation()
    .arguments({ internalKey: a.string().required(), slug: a.string().required(), firstName: a.string().required(), lastName: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(publicSite)),

  submitRsvp: a
    .mutation()
    .arguments({ internalKey: a.string().required(), slug: a.string().required(), payload: a.json().required() })
    .returns(a.json())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(publicSite)),

  recordSiteView: a
    .mutation()
    .arguments({ internalKey: a.string().required(), slug: a.string().required() })
    .returns(a.boolean())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(publicSite)),

  submitGuestbookEntry: a
    .mutation()
    .arguments({
      slug: a.string(),
      weddingId: a.string(),
      guestName: a.string().required(),
      message: a.string(),
      songRequest: a.string(),
      messageType: a.string(),
      mediaKey: a.string(),
      mediaType: a.string(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
    .handler(a.handler.function(publicSite)),

  submitGalleryUpload: a
    .mutation()
    .arguments({
      slug: a.string(),
      weddingId: a.string(),
      uploaderName: a.string().required(),
      fileKey: a.string().required(),
      fileType: a.string(),
      fileSizeBytes: a.integer(),
      caption: a.string(),
    })
    .returns(a.boolean())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
    .handler(a.handler.function(publicSite)),

  /** Owner-only: hashes and stores the site password (or clears it when password is empty). */
  setSitePassword: a
    .mutation()
    .arguments({ weddingId: a.string().required(), password: a.string() })
    .returns(a.boolean())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(publicSite)),

  // ---------------- File storage (storageAccess Lambda) ----------------
  // Clients have no direct S3 access to weddings/*; these presign after checking Wedding.owners.
  createUploadUrl: a
    .mutation()
    .arguments({
      weddingId: a.string().required(),
      visibility: a.string(),
      kind: a.string().required(),
      fileName: a.string().required(),
      contentType: a.string(),
    })
    .returns(a.ref('StorageUpload'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(storageAccess)),

  getFileUrl: a
    .query()
    .arguments({ key: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
    .handler(a.handler.function(storageAccess)),

  getFileUrls: a
    .query()
    .arguments({ keys: a.string().required().array().required() })
    .returns(a.ref('StorageFileUrl').array())
    .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
    .handler(a.handler.function(storageAccess)),

  deleteFile: a
    .mutation()
    .arguments({ key: a.string().required() })
    .returns(a.boolean())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(storageAccess)),

  /** Server-only (requires INTERNAL_API_SECRET); browsers call the rate-limited /api/website/upload-url. */
  createGuestUploadUrl: a
    .mutation()
    .arguments({
      internalKey: a.string().required(),
      slug: a.string().required(),
      kind: a.string().required(),
      fileName: a.string().required(),
      contentType: a.string(),
    })
    .returns(a.ref('StorageUpload'))
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(storageAccess)),

  // ---------------- Authenticated operations ----------------
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
    .authorization((allow) => [allow.groups(['admin'])])
    .handler(a.handler.function(removeUser)),

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
      // Max allowed by AppSync. Rotate by redeploying before expiry (see README).
      expiresInDays: 365,
    },
  },
});
