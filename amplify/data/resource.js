"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
var backend_1 = require("@aws-amplify/backend");
var resource_1 = require("../functions/send-email/resource");
var resource_2 = require("../functions/pdf-export/resource");
var resource_3 = require("../functions/ask-ivy/resource");
var resource_4 = require("../functions/remove-user/resource");
var schema = backend_1.a.schema({
    Wedding: backend_1.a
        .model({
        slug: backend_1.a.string().required(),
        coupleName1: backend_1.a.string().required(),
        coupleName2: backend_1.a.string().required(),
        weddingDate: backend_1.a.date().required(),
        venueName: backend_1.a.string(),
        heroImageKey: backend_1.a.string(),
        budgetTotal: backend_1.a.float(),
        qrCodeUrl: backend_1.a.string(),
        mealOptions: backend_1.a.string().array(),
        isActive: backend_1.a.boolean().default(true),
        websiteEnabled: backend_1.a.boolean().default(false),
        rsvpDeadline: backend_1.a.date(),
        rsvpMealOptions: backend_1.a.string().array(),
        rsvpCustomQuestions: backend_1.a.string(),
        rsvpConfirmationMsg: backend_1.a.string(),
        spotifyEmbedUrl: backend_1.a.string(),
    })
        .secondaryIndexes(function (index) { return [index('slug')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.groups(['vendor']).to(['read']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['read']),
    ]; }),
    WeddingMember: backend_1.a
        .model({
        profileId: backend_1.a.string().required(),
        weddingId: backend_1.a.string().required(),
        role: backend_1.a.enum(['admin', 'planner', 'vendor', 'guest']),
    })
        .secondaryIndexes(function (index) { return [index('profileId'), index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.groups(['admin']).to(['read', 'create', 'update', 'delete']),
        allow.authenticated().to(['read']) // Needs fine-grained auth eventually
    ]; }),
    Profile: backend_1.a
        .model({
        cognitoSub: backend_1.a.string().required(),
        fullName: backend_1.a.string(),
        email: backend_1.a.string(),
        vendorId: backend_1.a.string(),
    })
        .secondaryIndexes(function (index) { return [index('cognitoSub')]; })
        .authorization(function (allow) { return [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.groups(['admin']).to(['read']),
    ]; }),
    Vendor: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        category: backend_1.a.string(),
        companyName: backend_1.a.string(),
        contactPerson: backend_1.a.string(),
        email: backend_1.a.string(),
        phone: backend_1.a.string(),
        website: backend_1.a.string(),
        address: backend_1.a.string(),
        notes: backend_1.a.string(),
        contractStatus: backend_1.a.enum(['NOT_STARTED', 'SENT', 'SIGNED']),
        contractFileKey: backend_1.a.string(),
        quotedAmount: backend_1.a.float(),
        depositAmount: backend_1.a.float(),
        depositDueDate: backend_1.a.date(),
        balanceDueDate: backend_1.a.date(),
        depositPaid: backend_1.a.boolean().default(false),
        balancePaid: backend_1.a.boolean().default(false),
        portalAccess: backend_1.a.boolean().default(false),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        // vendor role can read their own via a custom filter or auth rule
        allow.groups(['vendor']).to(['read']),
    ]; }),
    ChecklistItem: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        category: backend_1.a.enum([
            'TWELVE_MONTHS', 'SIX_MONTHS', 'THREE_MONTHS', 'ONE_MONTH',
            'TWO_WEEKS', 'ONE_WEEK', 'DAY_BEFORE', 'DAY_OF'
        ]),
        title: backend_1.a.string().required(),
        description: backend_1.a.string(),
        assignedTo: backend_1.a.string(),
        notes: backend_1.a.string(),
        isTemplate: backend_1.a.boolean().default(false),
        isCompleted: backend_1.a.boolean().default(false),
        completedAt: backend_1.a.datetime(),
        dueDate: backend_1.a.date(),
        sortOrder: backend_1.a.integer(),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]; }),
    RunSheetItem: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        eventTime: backend_1.a.time().required(),
        durationMinutes: backend_1.a.integer(),
        title: backend_1.a.string().required(),
        description: backend_1.a.string(),
        location: backend_1.a.string(),
        assignedPerson: backend_1.a.string(),
        notes: backend_1.a.string(),
        assignedVendorIds: backend_1.a.string().array(),
        sortOrder: backend_1.a.integer(),
        itemType: backend_1.a.enum(['START', 'END', 'EVENT']),
        mode: backend_1.a.string(),
        isFixed: backend_1.a.boolean(),
        isPublic: backend_1.a.boolean().default(false),
        venuePhotoUrl: backend_1.a.string(),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.groups(['vendor']).to(['read']),
    ]; }),
    GalleryUpload: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        uploaderName: backend_1.a.string().required(),
        fileKey: backend_1.a.string().required(),
        fileType: backend_1.a.string(),
        fileSizeBytes: backend_1.a.integer(),
        thumbnailKey: backend_1.a.string(),
        caption: backend_1.a.string(),
        uploadedAt: backend_1.a.datetime(),
        isDeleted: backend_1.a.boolean().default(false),
        showOnWebsite: backend_1.a.boolean().default(false),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['create']),
        allow.publicApiKey().to(['create']),
    ]; }),
    Guest: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        firstName: backend_1.a.string().required(),
        lastName: backend_1.a.string(),
        email: backend_1.a.string(),
        phone: backend_1.a.string(),
        mealChoice: backend_1.a.string(),
        dietaryOther: backend_1.a.string(),
        messageToCouple: backend_1.a.string(),
        notes: backend_1.a.string(),
        rsvpStatus: backend_1.a.enum(['PENDING', 'CONFIRMED', 'DECLINED', 'MAYBE']),
        attendingCount: backend_1.a.integer().default(1),
        dietaryVegetarian: backend_1.a.boolean(),
        dietaryVegan: backend_1.a.boolean(),
        dietaryGlutenFree: backend_1.a.boolean(),
        dietaryNutFree: backend_1.a.boolean(),
        tableId: backend_1.a.string(),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['create']),
        allow.publicApiKey().to(['create']),
    ]; }),
    SeatingTable: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        tableName: backend_1.a.string(),
        shape: backend_1.a.enum(['ROUND', 'RECTANGLE', 'HEAD']),
        seatCount: backend_1.a.integer(),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]; }),
    BudgetItem: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        category: backend_1.a.string(),
        description: backend_1.a.string(),
        vendorId: backend_1.a.string(),
        estimatedCost: backend_1.a.float(),
        actualCost: backend_1.a.float(),
        notes: backend_1.a.string(),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
    ]; }),
    MoodBoard: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        title: backend_1.a.string().required(),
        shareToken: backend_1.a.string(),
    })
        .secondaryIndexes(function (index) { return [index('weddingId'), index('shareToken')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['read']),
    ]; }),
    MoodPin: backend_1.a
        .model({
        moodBoardId: backend_1.a.string().required(),
        imageKey: backend_1.a.string(),
        sourceUrl: backend_1.a.string(),
        title: backend_1.a.string(),
        notes: backend_1.a.string(),
        tags: backend_1.a.string().array(),
    })
        .secondaryIndexes(function (index) { return [index('moodBoardId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['read']),
    ]; }),
    WebsiteConfig: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        publishStatus: backend_1.a.enum(['DRAFT', 'PUBLISHED', 'POST_WEDDING']),
        subdomain: backend_1.a.string().required(),
        customDomain: backend_1.a.string(),
        passwordProtected: backend_1.a.boolean().default(false),
        sitePassword: backend_1.a.string(),
        siteTitle: backend_1.a.string(),
        metaDescription: backend_1.a.string(),
        ogImageUrl: backend_1.a.string(),
        siteLogoType: backend_1.a.enum(['TEXT_ONLY', 'STEWARD', 'RINGS', 'CROSS', 'DOVE', 'HEART', 'CUSTOM']),
        siteLogoKey: backend_1.a.string(),
        themeId: backend_1.a.string().required(),
        primaryColor: backend_1.a.string().required(),
        accentColor: backend_1.a.string().required(),
        backgroundColor: backend_1.a.string().required(),
        headingFont: backend_1.a.string().required(),
        bodyFont: backend_1.a.string().required(),
        buttonStyle: backend_1.a.enum(['ROUNDED', 'SQUARE', 'PILL']),
        sectionOrder: backend_1.a.string().required(),
        enabledSections: backend_1.a.string().required(),
        customCss: backend_1.a.string(),
        customJs: backend_1.a.string(),
        headInjection: backend_1.a.string(),
        viewCount: backend_1.a.integer().default(0),
    })
        .secondaryIndexes(function (index) { return [index('weddingId'), index('subdomain')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read', 'update']), // Allow guest to update viewCount
        allow.publicApiKey().to(['read', 'update']),
    ]; }),
    WebsiteAnalytics: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        dateString: backend_1.a.string().required(),
        views: backend_1.a.integer().default(0),
        uniqueVisitors: backend_1.a.integer().default(0),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['create', 'read', 'update']),
        allow.publicApiKey().to(['create', 'read', 'update']),
    ]; }),
    WebsiteStory: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        coupleStory: backend_1.a.string(),
        storyImageKey: backend_1.a.string(),
        howWeMetDate: backend_1.a.date(),
        engagementDate: backend_1.a.date(),
        engagementStory: backend_1.a.string(),
        milestones: backend_1.a.string(),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['read']),
    ]; }),
    WebsiteTravel: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        hotelName: backend_1.a.string().required(),
        address: backend_1.a.string(),
        bookingUrl: backend_1.a.string(),
        roomBlockCode: backend_1.a.string(),
        blockDeadline: backend_1.a.date(),
        distanceFromVenue: backend_1.a.string(),
        priceRange: backend_1.a.string(),
        notes: backend_1.a.string(),
        displayOrder: backend_1.a.integer().default(0),
        isVisible: backend_1.a.boolean().default(true),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['read']),
    ]; }),
    WebsitePartyMember: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        name: backend_1.a.string().required(),
        role: backend_1.a.string().required(),
        bio: backend_1.a.string(),
        photoUrl: backend_1.a.string(),
        displayOrder: backend_1.a.integer().default(0),
        isVisible: backend_1.a.boolean().default(true),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['read']),
    ]; }),
    WebsiteRegistry: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        registryName: backend_1.a.string().required(),
        registryUrl: backend_1.a.string().required(),
        logoUrl: backend_1.a.string(),
        description: backend_1.a.string(),
        isCashFund: backend_1.a.boolean().default(false),
        displayOrder: backend_1.a.integer().default(0),
        isVisible: backend_1.a.boolean().default(true),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['read']),
    ]; }),
    WebsiteFaq: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        question: backend_1.a.string().required(),
        answer: backend_1.a.string().required(),
        category: backend_1.a.string(),
        displayOrder: backend_1.a.integer().default(0),
        isVisible: backend_1.a.boolean().default(true),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['read']),
        allow.publicApiKey().to(['create', 'read']),
    ]; }),
    WebsiteGuestbook: backend_1.a
        .model({
        weddingId: backend_1.a.string().required(),
        guestName: backend_1.a.string().required(),
        message: backend_1.a.string(),
        songRequest: backend_1.a.string(),
        messageType: backend_1.a.enum(['GUESTBOOK', 'SONG_REQUEST', 'BOTH']),
        isApproved: backend_1.a.boolean().default(true),
        isDeleted: backend_1.a.boolean().default(false),
    })
        .secondaryIndexes(function (index) { return [index('weddingId')]; })
        .authorization(function (allow) { return [
        allow.authenticated().to(['create', 'read', 'update', 'delete']),
        allow.guest().to(['create', 'read']),
        allow.publicApiKey().to(['create', 'read']),
    ]; }),
    getWeddingBySlug: backend_1.a
        .query()
        .arguments({ slug: backend_1.a.string() })
        .returns(backend_1.a.ref('Wedding'))
        .authorization(function (allow) { return [allow.guest(), allow.publicApiKey()]; })
        .handler(backend_1.a.handler.function('')), // Placeholder until custom resolver defined
    exportPDF: backend_1.a
        .mutation()
        .arguments({ type: backend_1.a.string(), weddingId: backend_1.a.string() })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function(resource_2.pdfExport)),
    inviteUser: backend_1.a
        .mutation()
        .arguments({ email: backend_1.a.string(), role: backend_1.a.string(), weddingId: backend_1.a.string() })
        .returns(backend_1.a.boolean())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function(resource_1.sendEmail)),
    removeUser: backend_1.a
        .mutation()
        .arguments({ email: backend_1.a.string() })
        .returns(backend_1.a.boolean())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function(resource_4.removeUser)),
    getMoodBoardByShareToken: backend_1.a
        .query()
        .arguments({ token: backend_1.a.string() })
        .returns(backend_1.a.ref('MoodBoard'))
        .authorization(function (allow) { return [allow.guest(), allow.publicApiKey()]; })
        .handler(backend_1.a.handler.function('')),
    askIvy: backend_1.a
        .mutation()
        .arguments({
        message: backend_1.a.string(),
        weddingContext: backend_1.a.string(),
        conversationHistory: backend_1.a.string(),
        imageBase64: backend_1.a.string(),
        documentKey: backend_1.a.string()
    })
        .returns(backend_1.a.string())
        .authorization(function (allow) { return [allow.authenticated()]; })
        .handler(backend_1.a.handler.function(resource_3.askIvy)),
});
exports.data = (0, backend_1.defineData)({
    schema: schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});
