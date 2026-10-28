

💍  Wedding Steward

Public Wedding Website Feature

Google Antigravity — Code Generation Prompts

6 Prompts  ·  AWS Amplify Gen 2  ·  Next.js 14  ·  weddingsteward.com

v1.0  |  May 2026

How to Use These Prompts

Run the six prompts in order. Each builds on the previous. Before running each prompt, attach the Wedding Steward Specification document and any prior prompt outputs as context. Replace all [[PLACEHOLDERS]] with your real values before pasting.

Placeholder Reference

Placeholder

Replace With

[[DOMAIN]]

weddingsteward.com

[[ENV]]

prod  (or  staging)

[[GITHUB_REPO]]

your-org/wedding-steward

[[AWS_REGION]]

us-east-1  (or your preferred region)

[[ALERT_EMAIL]]

ops@weddingsteward.com

[[AMPLIFY_APP_ID]]

From AWS Amplify Console after first deploy

[[COUPLE_SLUG]]

URL slug for a test wedding e.g. sarah-and-tom



Prompt Dependency Map

Run prompts in the order shown. Attach indicated prior outputs as context for each.



#

Prompt

Outputs

Attach as Context

1

DB Schema — Website Tables

amplify/data/resource.ts (website models), seed SQL

WS Spec doc

2

Website Studio Tab

WebsiteStudio dashboard page + all sub-components

Spec + Prompt 1 output

3

Public Website Renderer

Public-facing [slug]/page.tsx + all section components

Spec + Prompts 1–2

4

RSVP Flow (Public → Admin)

Public RSVP form + admin sync + confirmation email

Spec + Prompts 1–3

5

Custom Code Editor (Advanced)

CSS/JS/HTML injection editor + sanitisation + preview

Spec + Prompts 1–3

6

Website Analytics & Post-Wedding

View counter, post-wedding mode toggle, guestbook moderation

Spec + Prompts 1–5



Prompt 1 — Database Schema: Website Tables

Extends the existing Amplify Gen 2 data schema with all tables required for the public wedding website feature. Run after the core Wedding Steward schema is in place.

Prompt #

1 of 6 — Website Feature Series

Depends On

Core Wedding Steward schema (weddings, guests, gallery_uploads, run_sheet_items)

Outputs

amplify/data/resource.ts additions · website seed SQL · TypeScript types

Attach to Next

Prompts 2, 3, 4, 5, 6



SCHEMA  ·  Amplify Gen 2 — Website Data Models

Add website tables to the existing resource.ts schema. All models scope to weddingId.



You are an expert AWS Amplify Gen 2 and TypeScript developer.

 

Extend the existing amplify/data/resource.ts schema for the Wedding Steward

SaaS platform (weddingsteward.com) by adding all data models required for

the public-facing wedding website feature. Do NOT modify existing models.

 

## NEW MODELS TO ADD

 

### 1. WebsiteConfig

One record per wedding. Stores publish state, domain, theme, and section order.

Fields:

  id                  String (primary key)

  weddingId           String (FK → Wedding, unique — one config per wedding)

  publishStatus       Enum: DRAFT | PUBLISHED | POST_WEDDING

  subdomain           String (unique, e.g. "sarah-and-tom")

  customDomain        String? (CNAME, e.g. "sarahandtom.com")

  passwordProtected   Boolean (default false)

  sitePassword        String? (hashed)

  siteTitle           String? (SEO title)

  metaDescription     String? (SEO description, max 160 chars)

  ogImageUrl          String? (social share image S3 key)

  themeId             String (references WebsiteTheme)

  primaryColor        String (hex, e.g. "#6B8F71")

  accentColor         String (hex)

  backgroundColor     String (hex)

  headingFont         String (e.g. "Playfair Display")

  bodyFont            String (e.g. "Lato")

  buttonStyle         Enum: ROUNDED | SQUARE | PILL

  sectionOrder        String (JSON array of section keys, e.g.

                      ["hero","story","events","rsvp","travel",

                       "party","gallery","registry","faq","guestbook"])

  enabledSections     String (JSON array of enabled section keys)

  customCss           String? (advanced — raw CSS blob, max 50KB)

  customJs            String? (advanced — raw JS blob, max 50KB)

  headInjection       String? (advanced — HTML injected into <head>)

  viewCount           Int (default 0)

  createdAt           AWSDateTime (auto)

  updatedAt           AWSDateTime (auto)

 

### 2. WebsiteStory

Our Story content — how they met, engagement, timeline milestones.

Fields:

  id                  String (primary key)

  weddingId           String (FK → Wedding, unique)

  coupleStory         String? (rich text / markdown, "our story" main body)

  howWeMetDate        AWSDate?

  engagementDate      AWSDate?

  engagementStory     String? (rich text)

  milestones          String? (JSON array of {date, title, body, imageUrl})

 

### 3. WebsiteTravel

Hotel blocks, accommodation recommendations, transport info.

Fields:

  id                  String (primary key)

  weddingId           String (FK → Wedding)

  hotelName           String

  address             String?

  bookingUrl          String?

  roomBlockCode       String?

  blockDeadline       AWSDate?

  distanceFromVenue   String? (e.g. "0.3 miles")

  priceRange          String? (e.g. "$150–$200/night")

  notes               String?

  displayOrder        Int (default 0)

  isVisible           Boolean (default true)

 

### 4. WebsitePartyMember

Wedding party bios. Separate from the guest list.

Fields:

  id                  String (primary key)

  weddingId           String (FK → Wedding)

  name                String

  role                String (e.g. "Maid of Honour", "Best Man")

  bio                 String? (short bio, max 300 chars)

  photoUrl            String? (S3 key)

  displayOrder        Int (default 0)

  isVisible           Boolean (default true)

 

### 5. WebsiteRegistry

External registry links + optional cash fund.

Fields:

  id                  String (primary key)

  weddingId           String (FK → Wedding)

  registryName        String (e.g. "Zola", "Amazon", "Cash Fund")

  registryUrl         String

  logoUrl             String? (S3 key or CDN URL)

  description         String? (optional note to guests)

  isCashFund          Boolean (default false)

  displayOrder        Int (default 0)

  isVisible           Boolean (default true)

 

### 6. WebsiteFaq

FAQ items + dress code.

Fields:

  id                  String (primary key)

  weddingId           String (FK → Wedding)

  question            String

  answer              String (rich text / markdown)

  category            Enum: GENERAL | DRESS_CODE | VENUE | GIFTS | KIDS_PETS | OTHER

  displayOrder        Int (default 0)

  isVisible           Boolean (default true)

 

### 7. WebsiteGuestbook

Guest messages + song requests. Guest-submitted, moderated by couple.

Fields:

  id                  String (primary key)

  weddingId           String (FK → Wedding)

  guestName           String

  message             String? (max 500 chars)

  songRequest         String? (song + artist)

  messageType         Enum: GUESTBOOK | SONG_REQUEST | BOTH

  isApproved          Boolean (default true)

  isDeleted           Boolean (default false)

  submittedAt         AWSDateTime (auto)

 

### 8. EXTEND: RunSheetItem (existing model)

Add two fields to the existing RunSheetItem model:

  isPublic            Boolean (default false) — show on website events section

  venuePhotoUrl       String? (S3 key) — photo shown on website for this event

 

### 9. EXTEND: GalleryUpload (existing model)

Add one field to existing GalleryUpload model:

  showOnWebsite       Boolean (default false) — surface in public gallery section

 

### 10. EXTEND: Guest (existing model)

Add fields to existing Guest model to support website RSVP config:

  rsvpDeadline        AWSDate? (per-wedding, store on Wedding model instead)

 

## AUTH RULES (apply to all new models)

- Admin/Planner: full CRUD scoped to their weddingId

- Public (unauthenticated): read WebsiteConfig by subdomain only if publishStatus=PUBLISHED

- Public: create WebsiteGuestbook (submit messages) — no read of others' messages

- Vendor: no access to website models

 

## EXTEND Wedding MODEL

Add to existing Wedding model:

  websiteEnabled      Boolean (default false)

  rsvpDeadline        AWSDate?

  rsvpMealOptions     String? (JSON array of strings)

  rsvpCustomQuestions String? (JSON array of {id, question, type: text|select, options?})

  rsvpConfirmationMsg String? (shown after guest submits RSVP)

  spotifyEmbedUrl     String? (for music section)

 

## DELIVERABLES

amplify/data/resource.ts  — updated schema with all new/extended models

amplify/data/website-seed.sql  — seed data: 3 default FAQ templates,

  dress code FAQ template, 4 preset themes (Romantic, Modern, Rustic, Minimalist)

src/lib/types/website.ts  — TypeScript interfaces for all website models

src/lib/website-defaults.ts  — default sectionOrder, enabledSections,

  theme presets with color/font values







Prompt 2 — Website Studio Tab (Admin Dashboard)

Builds the "Website Studio" section in the couple's admin dashboard. Replaces the old Inspiration/Mood Board tab. Two modes: Simple (theme picker, toggles, drag-reorder) and Advanced (CSS/JS editor).

Prompt #

2 of 6

Depends On

Prompt 1 outputs (website models + types)

Outputs

Full Website Studio dashboard section with all sub-pages and components

Attach to Next

Prompts 3, 5



DASHBOARD  ·  Website Studio — Admin Builder

Replace the Inspiration tab with a full Website Studio. Simple mode for all users; Advanced mode behind a toggle.



You are an expert Next.js 14 / React / Tailwind / AWS Amplify Gen 2 developer.

 

Build the Website Studio section of the Wedding Steward (weddingsteward.com)

admin dashboard. This replaces the old "Inspiration" tab entirely.

 

## NAVIGATION

Route: /dashboard/website

Sub-routes (tab navigation within the page):

  /dashboard/website            → Overview (publish status, live preview link, view count)

  /dashboard/website/design     → Theme & Design (Simple mode)

  /dashboard/website/content    → Content Sections (toggle + reorder + edit each section)

  /dashboard/website/rsvp       → RSVP Settings

  /dashboard/website/domain     → Domain & SEO

  /dashboard/website/advanced   → Advanced (CSS/JS — gated behind confirmation modal)

 

## OVERVIEW SUB-PAGE (/dashboard/website)

Components:

- PublishBanner: large status card showing DRAFT / PUBLISHED / POST_WEDDING

  with primary CTA button ("Publish Website" / "View Live Site" / "Unpublish")

- LivePreviewButton: opens [subdomain].weddingsteward.com in new tab

- ViewCounter: animated count of total site views (from WebsiteConfig.viewCount)

- SectionCompleteness: progress checklist — which sections have content filled in

  (Hero ✓, Our Story ✗, Events ✓, RSVP ✗ …) with "Edit" links per section

- QRShareCard: shows the website URL as a QR code — couples share this on invitations

 

## DESIGN SUB-PAGE (/dashboard/website/design)

Two modes toggled by a "Simple / Advanced" pill toggle at the top.

 

Simple Mode (default):

- ThemePicker: 4 preset themes displayed as visual cards with preview swatches

  Themes: Romantic (blush + gold), Modern (slate + champagne),

          Rustic (sage + terracotta), Minimalist (white + black)

  Selecting a theme auto-fills primaryColor, accentColor, backgroundColor,

  headingFont, bodyFont

- ColorCustomiser: 3 color pickers (primary, accent, background)

  Show preset palette swatches (8 swatches per color) + hex input fallback

- FontPairer: 4 curated font pairing options shown as styled text samples:

  (Playfair Display / Lato), (Cormorant Garamond / Montserrat),

  (Great Vibes / Open Sans), (Libre Baskerville / Raleway)

- ButtonStylePicker: 3 visual options (Rounded, Square, Pill)

- LiveMiniPreview: 400px-wide iframe preview of the site that updates on every change

  (debounced 800ms). Show loading skeleton while preview reloads.

 

## CONTENT SUB-PAGE (/dashboard/website/content)

- SectionList: drag-and-drop list of all 10 sections using @dnd-kit/sortable

  Each row shows: drag handle, section name, enabled toggle (switch), "Edit" button

  Reordering auto-saves to WebsiteConfig.sectionOrder

  Toggling auto-saves to WebsiteConfig.enabledSections

 

Section editors — each opens as a slide-over panel (Sheet from shadcn/ui):

 

  HERO: HeroPhotoUpload (drag-drop, 16:9 crop, stores to S3),

    CountdownLabel text input, HeroTagline text input

 

  OUR STORY: RichTextEditor (Tiptap — bold, italic, headings, bullet lists only),

    HowWeMetDate datepicker, EngagementDate datepicker,

    MilestoneList (add/remove/reorder milestone items with date + title + body + photo)

 

  EVENTS: EventList — shows RunSheetItems with isPublic toggle per item,

    venue photo upload per item, map URL input per item.

    Pulls data from existing run sheet — no re-entry needed.

 

  TRAVEL: TravelList — CRUD list of WebsiteTravel records,

    each with hotel name, address, booking URL, room block code,

    deadline, distance, price range, notes. Drag to reorder.

 

  WEDDING PARTY: PartyMemberList — CRUD list of WebsitePartyMember records,

    each with photo upload, name, role, bio. Drag to reorder.

 

  GALLERY: GalleryWebsiteFilter — grid of existing GalleryUpload records,

    each with showOnWebsite checkbox. "Select All" / "Deselect All" controls.

    Layout style picker: Grid | Masonry | Slideshow

 

  REGISTRY: RegistryList — CRUD list of WebsiteRegistry records,

    each with name, URL, logo upload, cash fund toggle, description.

    Preset logos: Zola, Amazon, Target, Williams Sonoma, Bed Bath & Beyond.

 

  FAQ & DRESS CODE: FaqList — CRUD list of WebsiteFaq records,

    each with question, answer, category. Drag to reorder.

    DressCodeCard: shortcut FAQ item for dress code (pre-populated template).

 

  GUESTBOOK: GuestbookSettings — enable/disable guestbook toggle,

    SpotifyEmbedInput (paste Spotify playlist URL → auto-generates embed),

    moderation toggle (auto-approve vs manual approval).

    GuestbookModerationTable — table of submitted messages with Approve/Delete actions.

 

## RSVP SUB-PAGE (/dashboard/website/rsvp)

- RsvpDeadlinePicker: date picker → saves to Wedding.rsvpDeadline

- MealOptionsEditor: tag-input for meal choices (e.g. Beef, Chicken, Vegetarian, Vegan)

- CustomQuestionsBuilder: add/remove custom RSVP questions

  Each question has: question text, type (text input OR dropdown select), options if dropdown

- ConfirmationMessageEditor: textarea for post-RSVP thank-you message shown to guest

- RsvpSummaryWidget: live count of RSVPs received, % responded, attending/not attending

 

## DOMAIN & SEO SUB-PAGE (/dashboard/website/domain)

- SubdomainDisplay: shows [subdomain].weddingsteward.com (read-only, set at wedding creation)

- CustomDomainInput: text input for CNAME domain (Advanced users)

  Show DNS instructions: "Point a CNAME record to: sites.weddingsteward.com"

  DomainVerificationStatus badge: Unverified / Verifying / Verified / Error

- PasswordProtectionToggle: enable/disable + password input (bcrypt-hashed on save)

- SeoFields: site title input (max 60 chars), meta description textarea (max 160 chars)

- OgImageUpload: social share image upload (1200×630px recommended)

 

## UX REQUIREMENTS

- Auto-save with debounce (1200ms) on all text inputs. Show "Saving…" / "Saved ✓" indicator.

- Unsaved changes warning on navigation away (useBeforeUnload hook)

- All image uploads: drag-drop + click-to-browse, show upload progress, S3 via Amplify Storage

- Empty state for each section editor: friendly prompt with illustration + "Add your first…" CTA

- Mobile responsive: all panels stack vertically on <768px

 

## DELIVERABLES

src/app/(dashboard)/website/page.tsx                  — Overview

src/app/(dashboard)/website/design/page.tsx           — Theme & Design

src/app/(dashboard)/website/content/page.tsx          — Content sections

src/app/(dashboard)/website/rsvp/page.tsx             — RSVP settings

src/app/(dashboard)/website/domain/page.tsx           — Domain & SEO

src/app/(dashboard)/website/advanced/page.tsx         — Advanced (shell only)

src/components/features/website/studio/              — All studio components

src/components/features/website/editors/             — All section slide-over editors

src/lib/hooks/useWebsiteConfig.ts                    — React Query hook for WebsiteConfig

src/lib/hooks/useAutoSave.ts                         — Debounced auto-save hook







Prompt 3 — Public Website Renderer

The actual public-facing website guests visit. Rendered at [slug].weddingsteward.com or a custom domain. Server-side rendered for SEO. Each section is a modular component driven entirely by the WebsiteConfig and related data.

Prompt #

3 of 6

Depends On

Prompts 1 + 2

Outputs

Public Next.js route with all 10 section components + mobile nav + password gate

Attach to Next

Prompt 4 (RSVP form lives here)



PUBLIC SITE  ·  Next.js Public Wedding Website

SSR public site at /[slug]. Renders all enabled sections in configured order. Fully mobile-first.



You are an expert Next.js 14 / React / Tailwind CSS developer.

Build the public-facing wedding website rendered by Wedding Steward.

 

## ROUTING STRATEGY

The public website lives at a SEPARATE Next.js route group from the dashboard:

  src/app/(public)/[slug]/page.tsx

  Middleware detects custom domains and rewrites to /[slug] transparently.

 

On load:

  1. Fetch WebsiteConfig by subdomain slug (public, unauthenticated)

  2. If publishStatus !== PUBLISHED → show "Coming Soon" page (couple names + date)

  3. If passwordProtected === true and no valid session cookie → show PasswordGate

  4. Render sections in sectionOrder, skip sections not in enabledSections

 

## GLOBAL LAYOUT

- PublicSiteLayout: applies theme CSS variables to :root

  CSS vars: --color-primary, --color-accent, --color-bg,

             --font-heading, --font-body, --button-radius

- StickyNav: transparent → solid on scroll. Links to each enabled section (smooth scroll).

  Mobile: hamburger menu. Shows couple names in the nav brand slot.

- Footer: "Made with Wedding Steward · weddingsteward.com" (small, tasteful)

- viewCount increment: fire-and-forget API call on page load (POST /api/website/view)

 

## SECTION COMPONENTS (build all 10)

 

### HeroSection

- Full-viewport hero image (from WebsiteConfig via HeroPhotoUrl)

- Overlay with couple names (heading font, large), wedding date, tagline

- Live countdown timer: DD days HH:MM:SS (JS, client-side)

- After wedding date: hide countdown, show "We're married! 🎉"

- CTA button: "RSVP Now" → smooth scroll to #rsvp (only if RSVP section enabled)

 

### OurStorySection

- Alternating text/image layout for milestones (timeline style)

- How We Met date + story text

- Engagement date + story text

- MilestoneTimeline: vertical timeline with date markers

 

### EventsSection

- EventCard per RunSheetItem with isPublic=true

- Each card: event name, date, time, address, Google Maps button,

  venue photo (if set), parking/transport notes

- AddToCalendar button: generates .ics download (ceremony + reception)

 

### RsvpSection

- Placeholder — full form built in Prompt 4

- For now: render <RsvpFormPlaceholder> with "RSVP form coming in Prompt 4" comment

 

### TravelSection

- HotelCard per WebsiteTravel record in displayOrder

- Each card: hotel name, address, distance from venue, price range,

  "Book Now" button (links to bookingUrl), room block code badge (if set)

- Block deadline alert if within 30 days: "Room block expires [date]!"

- AirportInfo freetext block if set

 

### WeddingPartySection

- Responsive grid: 4 columns desktop, 2 tablet, 1 mobile

- PartyMemberCard: circular photo, name, role (styled badge), bio

- Empty state: hidden if no party members added

 

### GallerySection

- Shows GalleryUpload records where showOnWebsite=true

- Renders based on galleryLayout: Grid | Masonry | Slideshow

- Lightbox on click (use yet-another-react-lightbox)

- Lazy loading with blur placeholder

 

### RegistrySection

- RegistryCard per WebsiteRegistry in displayOrder

- Logo (if set) or text name, optional description, "View Registry" CTA button

- Cash fund cards styled with a gift icon

 

### FaqSection

- Accordion (shadcn/ui Accordion) per WebsiteFaq record in displayOrder

- Grouped by category with category headings

- DressCode item pinned to top if category=DRESS_CODE

 

### GuestbookSection

- GuestbookMessageList: shows approved messages (isApproved=true, isDeleted=false)

  Masonry card layout. Each card: guest name, message, date.

- GuestbookForm: name input, message textarea (max 500 chars), submit button

  After submit: "Thanks [name]! Your message has been shared with [couple names]."

- SongRequestForm (if spotifyEmbedUrl set): song + artist input + submit

- SpotifyEmbed: renders iframe from spotifyEmbedUrl

 

## PASSWORD GATE

- Simple centered form: Wedding Steward logo, couple names, password input, "Enter" button

- On correct password: set httpOnly cookie (7-day expiry), redirect to site

- Wrong password: shake animation + "Incorrect password" message

- Route: /api/website/verify-password (POST)

 

## COMING SOON PAGE

- Shows when publishStatus=DRAFT

- Elegant page: couple names, wedding date, countdown, "Check back soon!" message

- No nav, no sections, no footer link

 

## POST-WEDDING MODE

- When publishStatus=POST_WEDDING:

  Hide RSVP section entirely

  Show "We're Married!" banner above hero

  Gallery section shows guest-uploaded photos prominently

  Guestbook remains open

 

## PERFORMANCE REQUIREMENTS

- generateStaticParams for known slugs at build time

- revalidate: 60 (ISR — refresh every 60 seconds for content changes)

- All images via next/image with sizes prop for responsive srcset

- Fonts preloaded via next/font/google

- Target Lighthouse score: ≥90 Performance, ≥95 Accessibility

 

## DELIVERABLES

src/app/(public)/[slug]/page.tsx                    — Main public page (SSR)

src/app/(public)/[slug]/layout.tsx                  — Theme CSS vars injection

src/app/(public)/[slug]/coming-soon/page.tsx        — Draft state page

src/app/(public)/[slug]/password/page.tsx           — Password gate

src/app/api/website/verify-password/route.ts        — Password check API

src/app/api/website/view/route.ts                   — View counter increment

src/components/features/website/public/            — All 10 section components

src/components/features/website/public/PublicSiteLayout.tsx

src/components/features/website/public/StickyNav.tsx

src/middleware.ts (update)  — custom domain rewrite rules







Prompt 4 — RSVP Flow (Public Form → Admin Sync)

The public RSVP form guests complete, plus the server-side logic that syncs responses back into the Guest List in the admin dashboard. Includes confirmation email via SES.

Prompt #

4 of 6

Depends On

Prompts 1, 2, 3

Outputs

RsvpSection public form + API route + guest record update + SES confirmation email

Attach to Next

Prompt 6 (analytics includes RSVP response rate)



RSVP  ·  Public RSVP Form + Admin Sync

Multi-step public RSVP form. Responses sync to Guest model in real time. SES confirmation email to guest.



You are an expert Next.js 14 / React / Tailwind / AWS Amplify + SES developer.

Build the complete RSVP feature for Wedding Steward (weddingsteward.com).

 

## PUBLIC RSVP FORM (replaces RsvpFormPlaceholder from Prompt 3)

 

Multi-step form with progress indicator (Step 1 of N):

 

Step 1 — Guest Lookup:

  Text input: "Your name" (first + last)

  Fuzzy-match against Guest records for the wedding (use Fuse.js, threshold 0.35)

  Show matched guest card(s) for confirmation: "Is this you?" with name + any existing details

  If no match: show "Not on the list? Contact [couple email]" message + stop flow

  If match: proceed to Step 2

 

Step 2 — Attendance:

  Large Yes/No toggle: "Will you be joining us?" (Joyfully accepts / Regretfully declines)

  If declining: optional message textarea → save + skip to confirmation

  If attending: proceed to Step 3

 

Step 3 — Plus One (conditional):

  Only shown if guest has plusOneAllowed=true on their Guest record

  "Will you be bringing a guest?" Yes/No

  If yes: plus one name input (required)

 

Step 4 — Meal Choice (conditional):

  Only shown if Wedding.rsvpMealOptions is non-empty

  Radio button group per attendee (guest + plus one if applicable)

  E.g. for guest: "Your meal choice: ○ Beef ○ Chicken ○ Vegetarian"

  Dietary restrictions: text input (allergies, other notes)

 

Step 5 — Custom Questions (conditional):

  Only shown if Wedding.rsvpCustomQuestions is non-empty

  Render each question dynamically (text input or select dropdown per question type)

 

Step 6 — Review & Submit:

  Summary of all answers. "Edit" links back to relevant steps.

  Guest email input (optional — for confirmation email)

  Submit button. Disable after first submit to prevent duplicates.

 

Confirmation State:

  Show Wedding.rsvpConfirmationMsg (or default: "Thank you! We can't wait to celebrate with you.")

  Confetti animation (canvas-confetti) if attending

  "Add to Calendar" button if attending (generates .ics)

 

## API ROUTE: POST /api/rsvp/submit

Request body:

  { weddingSlug, guestId, attending, plusOneName?, mealChoice?,

    plusOneMealChoice?, dietaryNotes?, customAnswers?, guestEmail? }

 

Server actions:

  1. Validate weddingSlug → fetch Wedding, verify publishStatus=PUBLISHED

  2. Verify guestId belongs to this wedding

  3. Check rsvpDeadline — if past deadline: return 410 Gone with friendly message

  4. Update Guest record:

       rsvpStatus: ATTENDING | DECLINED

       mealChoice, dietaryRestrictions, plusOneName,

       plusOneMealChoice, customRsvpAnswers (JSON), rsvpSubmittedAt

  5. If guestEmail provided: send SES confirmation email (see below)

  6. Return { success: true, message: rsvpConfirmationMsg }

 

Rate limiting: 10 RSVP submissions per IP per hour (Upstash or in-memory)

Idempotency: if guest already RSVPd, overwrite with new response (allow changes)

 

## CONFIRMATION EMAIL (SES)

Triggered after successful RSVP submission when guestEmail is provided.

 

From: noreply@weddingsteward.com

Subject: "Your RSVP for [Couple Names]' Wedding is confirmed!"

 

HTML email template:

  - Couple names as heading (styled with their chosen headingFont via inline styles)

  - "Hi [Guest Name]," greeting

  - Attending: "We're so excited to celebrate with you on [Date] at [Venue]!"

    Declining: "We'll miss you, but thank you for letting us know."

  - Summary box: meal choice, dietary notes, plus one name

  - Event details: ceremony time, venue name, address

  - Website link: "Visit our wedding website: [url]"

  - Footer: "Questions? Reach us at [couple contact email]"

 

Plain text fallback required.

Use @aws-sdk/client-ses for sending.

 

## ADMIN RSVP DASHBOARD (in /dashboard/website/rsvp)

Extend the RSVP sub-page from Prompt 2 with live response data:

- RsvpResponseTable: sortable/filterable table of all guests with RSVP status

  Columns: Guest Name, Status, Meal, Dietary Notes, Plus One, Submitted At

  Filter: All / Attending / Declined / No Response

  Export: CSV download button

- RsvpSummaryStats: total invited, % responded, attending count, declined count

  meal choice breakdown pie chart (recharts)

 

## DELIVERABLES

src/components/features/website/public/RsvpSection.tsx  — full multi-step form

src/components/features/website/public/RsvpConfirmation.tsx

src/app/api/rsvp/submit/route.ts                        — submission API route

src/lib/email/rsvp-confirmation.ts                      — SES email template + sender

src/components/features/website/studio/RsvpResponseTable.tsx

src/components/features/website/studio/RsvpSummaryStats.tsx







Prompt 5 — Advanced Code Editor (CSS / JS / HTML)

The power-user escape hatch. A Monaco-based code editor in the dashboard letting advanced couples inject custom CSS, JavaScript, and HTML blocks into their public site. Includes sanitisation, live preview, and a warning modal.

Prompt #

5 of 6

Depends On

Prompts 1, 2, 3

Outputs

Advanced editor page with Monaco, sanitiser, live preview sync, and per-section HTML blocks

Attach to Next

Prompt 6



ADVANCED  ·  Custom Code Editor — CSS / JS / HTML Injection

Monaco editor with live preview. Sanitised before save. Gated behind a "I know what I'm doing" modal.



You are an expert Next.js 14 / React developer building a code editor feature.

Build the Advanced Code Editor for Wedding Steward (weddingsteward.com).

 

## ACCESS GATE

Route: /dashboard/website/advanced

On first visit: show AdvancedModeModal (cannot be dismissed without confirming):

  Title: "Advanced Mode"

  Body: "Custom code lets you personalise your site beyond the built-in tools.

    Errors in your code can break your website for guests. Wedding Steward

    cannot provide support for custom code issues."

  Checkbox: "I understand — enable advanced mode"

  CTA: "Enable Advanced Mode" (disabled until checkbox checked)

  Once confirmed: save advancedModeEnabled=true to user profile, never show again.

 

## EDITOR LAYOUT

Split-pane layout (resizable):

  Left: Monaco editor tabs (CSS | JavaScript | HTML Blocks)

  Right: live preview iframe (same iframe as Prompt 2 design preview)

 

Top bar:

  "Save Changes" button (primary), "Revert" button (secondary),

  "Preview in New Tab" link, "Disable Advanced Mode" link (with confirm dialog)

 

## CSS TAB

- Monaco editor, language: "css"

- Starter comment block:

    /* Wedding Steward — Custom CSS

     * CSS variables available:

     *   --color-primary, --color-accent, --color-bg

     *   --font-heading, --font-body, --button-radius

     * Tip: use browser DevTools to inspect section IDs (e.g. #rsvp, #gallery)

     */

- Max 50KB. Show character/byte counter in editor gutter.

- Sanitisation before save: strip @import rules, strip url() with external domains

  (allow only relative paths and data: URIs), warn user if stripped.

- Custom Font support: if user pastes a Google Fonts @import, parse the font-family

  name and add it as a preload link in the public site <head>

 

## JAVASCRIPT TAB

- Monaco editor, language: "javascript"

- Starter comment block:

    // Wedding Steward — Custom JavaScript

    // Runs after the page fully loads (DOMContentLoaded)

    // window.weddingData is available:

    //   { coupleName, weddingDate, venueName, primaryColor, accentColor }

- Max 50KB.

- Sanitisation before save (server-side, use DOMPurify-equivalent for JS):

  Block: document.cookie access, localStorage/sessionStorage writes,

         fetch() calls to non-weddingsteward.com domains,

         eval(), Function(), innerHTML assignments to forms

  Warn user (do not silently strip JS — show exact line + reason), require confirmation

- Injected into public site via <script> tag before </body>

- window.weddingData object injected by server before user JS runs

 

## HTML BLOCKS TAB

- Per-section HTML block injection (not global)

- SectionBlockList: list of all enabled sections with an "Add HTML Block" button each

- For each section with an HTML block:

  Position selector: TOP of section | BOTTOM of section

  Monaco editor, language: "html", max 20KB per block

  Use cases: embed a Google Map, add a custom countdown widget, embed Typeform

- Sanitisation: DOMPurify on server before save.

  Allow: standard HTML elements, iframe (weddingsteward.com, google.com,

    maps.googleapis.com, spotify.com, youtube.com, typeform.com, vimeo.com only)

  Block: script tags, event handlers (onclick etc.), data: URIs in src/href

 

## LIVE PREVIEW SYNC

- CSS changes: debounce 600ms → postMessage to preview iframe

  iframe receives message and injects CSS into a <style id="custom-preview"> tag

  (no full reload needed for CSS)

- JS changes: debounce 1200ms → full iframe src reload (append ?preview=true&t=[ts])

- HTML block changes: debounce 800ms → full iframe src reload

 

## ERROR HANDLING

- CSS parse errors: show inline Monaco error markers

- If preview iframe throws a JS error: catch in iframe onError,

  postMessage to parent → show ErrorBanner above editor:

  "Your custom JavaScript has an error: [message]. Guests will see the site

  without your custom script until this is fixed."

- Save blocked if sanitisation finds blocked patterns (show modal listing issues)

 

## DELIVERABLES

src/app/(dashboard)/website/advanced/page.tsx       — Advanced editor page

src/components/features/website/advanced/           — All advanced editor components

  AdvancedModeModal.tsx, CodeEditorPane.tsx,

  CssEditor.tsx, JsEditor.tsx, HtmlBlocksEditor.tsx

  SanitisationWarningModal.tsx

src/lib/sanitise/css.ts      — CSS sanitiser (strip @import, external url())

src/lib/sanitise/js.ts       — JS sanitiser (pattern detection + warn)

src/lib/sanitise/html.ts     — HTML sanitiser (DOMPurify wrapper + allowed iframes)

src/app/api/website/save-code/route.ts  — Sanitise + save custom code API







Prompt 6 — Analytics, Post-Wedding Mode & Guestbook Moderation

Completes the website feature with a simple analytics dashboard, the post-wedding mode transition, and full guestbook/song-request moderation tools for the couple.

Prompt #

6 of 6

Depends On

Prompts 1–5

Outputs

WebsiteAnalytics dashboard widget, post-wedding mode flow, guestbook moderation table

Attach to Next

N/A — final prompt in this series



ANALYTICS  ·  Analytics + Post-Wedding + Guestbook Moderation

Lightweight analytics, automated post-wedding transition, and guestbook tools.



You are an expert Next.js 14 / React / Recharts developer.

Build the final pieces of the Wedding Steward website feature.

 

## WEBSITE ANALYTICS WIDGET

Location: /dashboard/website (Overview sub-page, below existing cards)

 

WebsiteAnalyticsCard component:

  - Total Views: animated count from WebsiteConfig.viewCount

  - RSVP Response Rate: (guests who RSVPd / total invited) as % + progress bar

  - Attending / Declining: count badges

  - Guestbook Messages: count of approved messages

  - Song Requests: count of song requests submitted

  - Days Until Wedding: simple countdown badge (or "Married!" if past)

 

ViewTrendMiniChart (recharts AreaChart):

  - Store daily view counts in a new WebsiteViewLog model:

      { id, weddingId, date (AWSDate), viewCount (Int) }

      Increment daily bucket via upsert in POST /api/website/view

  - Chart shows last 30 days of daily views

  - Tooltip: "N views on [date]"

 

## POST-WEDDING MODE

Automatic transition:

  - Nightly Lambda (schedule: cron(0 2 * * ? *)) scans weddings where

    weddingDate < today AND websiteEnabled=true AND publishStatus=PUBLISHED

    → set publishStatus=POST_WEDDING for those WebsiteConfigs

  - Define in amplify/functions/post-wedding-transition/handler.ts

  - Lambda runtime: Node.js 20.x, timeout: 60s, memory: 256MB

 

Dashboard prompt (shown in Overview when weddingDate is within 7 days past):

  PostWeddingBanner:

  "Congratulations! 🎉 Your wedding was [N] days ago."

  "Your website is now in Post-Wedding mode. The RSVP section is hidden

   and your guest photo gallery is front and centre."

  "Want to add your wedding photos? Go to Gallery →"

  Actions: "Keep site live" | "Unpublish site"

 

Manual toggle:

  In /dashboard/website (Overview) → PublishBanner adds a third state:

  "Switch to Post-Wedding Mode" button (available once weddingDate is past)

  Confirmation modal: "This will hide the RSVP form and reorder sections

   to feature your gallery. Continue?"

 

## GUESTBOOK MODERATION

Location: /dashboard/website/content → Guestbook section editor

(Extends GuestbookSettings from Prompt 2)

 

GuestbookModerationTable:

  Columns: Submitted At, Guest Name, Message (truncated), Song Request, Status, Actions

  Status badge: Approved (green) | Pending (amber) | Deleted (gray)

  Actions per row: Approve / Delete (soft delete: isDeleted=true)

  Bulk actions: "Approve All Pending" / "Delete Selected"

  Filter tabs: All | Pending | Approved | Song Requests

 

Moderation mode toggle (in GuestbookSettings):

  Auto-approve (default): new submissions → isApproved=true immediately

  Manual approval: new submissions → isApproved=false, couple reviews in table

  If manual: show PendingBadge in navigation: "Guestbook (3 pending)"

 

Email notification (SES) when new guestbook message received:

  Only if manualApproval=true (auto-approve mode = no email to reduce noise)

  To: couple admin email. Subject: "New guestbook message from [Guest Name]"

  Body: message preview + link to moderation table

 

## ADD TO SCHEMA (extend Prompt 1 deliverable)

Add new model WebsiteViewLog to amplify/data/resource.ts:

  id         String

  weddingId  String (FK → Wedding)

  date       AWSDate

  viewCount  Int (default 0)

  Auth: Admin/Planner read only. Lambda function write only.

 

## DELIVERABLES

src/components/features/website/studio/WebsiteAnalyticsCard.tsx

src/components/features/website/studio/ViewTrendMiniChart.tsx

src/components/features/website/studio/PostWeddingBanner.tsx

src/components/features/website/studio/GuestbookModerationTable.tsx

amplify/functions/post-wedding-transition/handler.ts  — nightly Lambda

amplify/functions/post-wedding-transition/resource.ts — schedule definition

amplify/data/resource.ts (update)  — add WebsiteViewLog model

src/app/api/website/view/route.ts (update)  — upsert daily ViewLog bucket







