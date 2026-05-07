# Wedding Steward — Feature Prompt
## Email Studio (Guest Communications Hub)

---

### Meta

| Field | Value |
|---|---|
| Feature Name | Email Studio — Guest Communications Hub |
| Prompt Series | Standalone feature prompt (attach core Wedding Steward spec + schema as context) |
| Depends On | Core schema: `weddings`, `guests`, `rsvp_responses`; AWS SES already wired via Amplify Functions |
| Outputs | DB schema additions · Amplify Function (SES sender) · AppSync mutations · Next.js dashboard tab · UI components |
| Attach to Next | Any subsequent prompt that references guest communications, RSVP flow, or notifications |

---

### Overview

Add a full **Email Studio** feature to the Wedding Steward dashboard. This feature allows couples (and their planners, if the planner role is active) to design, preview, manage, and send all wedding-related guest emails from within the app — using AWS SES as the delivery layer, consistent with the existing email infrastructure.

The six email types to support are:

1. **Save the Date** — First announcement, sent 6–12 months before the wedding
2. **Formal Invitation** — Full invite with RSVP link and deadline, sent 6–8 weeks before
3. **RSVP Reminder** — Gentle nudge for guests who have not responded, sent 1–2 weeks before RSVP deadline
4. **Event Reminder 1** — Logistics and excitement, sent ~1 month before the wedding
5. **Event Reminder 2** — Final details and day-of info, sent ~1 week before
6. **Thank You** — Post-wedding gratitude, sent within 1–2 weeks after

---

### Database Schema Additions

Add the following models to `amplify/data/resource.ts`. All models scope to `weddingId` and follow the existing Row Level Security pattern.

```typescript
// Email campaign — one record per send event
EmailCampaign: {
  id: string (auto)
  weddingId: string (FK → Wedding)
  emailType: enum('save_the_date' | 'invitation' | 'rsvp_reminder' | 'event_reminder_1' | 'event_reminder_2' | 'thank_you')
  subjectLine: string
  paletteKey: enum('classic' | 'sage' | 'navy' | 'dusty_rose')
  personalNote: string (optional)
  customContent: string (optional)
  scheduledAt: AWSDateTime (optional — for future scheduling)
  sentAt: AWSDateTime (optional — populated on send)
  status: enum('draft' | 'sent' | 'scheduled' | 'failed')
  sentCount: int (default 0)
  failedCount: int (default 0)
  createdAt: AWSDateTime (auto)
  updatedAt: AWSDateTime (auto)
}

// Individual send record — one per recipient per campaign
EmailSendRecord: {
  id: string (auto)
  campaignId: string (FK → EmailCampaign)
  weddingId: string (FK → Wedding)
  guestId: string (FK → Guest, optional — allows sending to non-guest addresses)
  recipientEmail: string
  recipientName: string (optional)
  status: enum('queued' | 'sent' | 'failed' | 'bounced' | 'opened')
  sesMessageId: string (optional — SES MessageId for tracking)
  sentAt: AWSDateTime (optional)
  errorMessage: string (optional)
}
```

---

### Amplify Function — SES Email Sender

Create a new Lambda function at `amplify/functions/send-wedding-email/handler.ts`.

**Trigger:** AppSync mutation `sendWeddingEmail`

**Responsibilities:**
- Accept a `campaignId` and list of `recipientEmails` (or `guestIds` to look up)
- Retrieve wedding details from the database (couple names, date, venue, city, RSVP date, RSVP link, website)
- Build the HTML email body using the template engine (see Template Engine below)
- Send via `@aws-sdk/client-ses` using `SendEmailCommand`, one call per recipient (to support per-recipient tracking) or `SendBulkTemplatedEmailCommand` for large lists
- Write an `EmailSendRecord` for each recipient with the resulting SES MessageId or error
- Update `EmailCampaign.status`, `sentCount`, and `failedCount` on completion

**IAM:** Grant `ses:SendEmail` and `ses:SendBulkTemplatedEmail` to the function's execution role. The From address should be pulled from Amplify environment variables (`SES_FROM_EMAIL`, `SES_FROM_NAME`).

**Environment variables needed:**
```
SES_FROM_EMAIL=notifications@weddingsteward.com
SES_FROM_NAME=Wedding Steward
SES_REGION=us-east-1  (or match the app's primary region)
```

---

### Template Engine

Build a server-side HTML template engine in `amplify/functions/send-wedding-email/templates.ts`.

The engine takes:
- `emailType: EmailType`
- `weddingData: WeddingEmailData` (couple names, date, time, venue, city, RSVP date, RSVP link, website URL)
- `paletteKey: PaletteKey`
- `personalNote?: string`
- `customContent?: string`

And returns a complete, inline-styled HTML string safe for email clients.

**Four color palettes to implement:**

| Key | Dark | Accent | Light | Background |
|---|---|---|---|---|
| `classic` | `#2c2420` | `#b8975a` | `#e8cec9` | `#faf7f2` |
| `sage` | `#3d5040` | `#6a8c6e` | `#dde8dd` | `#f5faf5` |
| `navy` | `#1a2740` | `#8fa8c8` | `#dce8f0` | `#f5f8fc` |
| `dusty_rose` | `#5a3a3a` | `#c8908a` | `#f5e0da` | `#fdf5f3` |

**All six email templates** must be implemented. Each template follows this structure:
- Header block: dark background, couple names, email-type subtitle, 4px gradient divider bar
- Body block: white background, Georgia serif font, personal note (if provided), main content, info box (date/venue/RSVP details as appropriate), CTA button, custom content block (if provided)
- Footer block: dark background, couple names centered, wedding website URL

All styles must be inline (no `<style>` tags, no external CSS) for maximum email client compatibility.

---

### AppSync Schema Additions

Add to the GraphQL schema:

```graphql
type EmailCampaign @model @auth(...) {
  # fields as above
}

type EmailSendRecord @model @auth(...) {
  # fields as above
}

type SendEmailResult {
  campaignId: ID!
  sentCount: Int!
  failedCount: Int!
  errors: [String]
}

type Mutation {
  sendWeddingEmail(
    campaignId: ID!
    recipientEmails: [String]
    guestIds: [ID]
    emailType: EmailType!
    subjectLine: String!
    paletteKey: PaletteKey!
    personalNote: String
    customContent: String
  ): SendEmailResult @function(name: "send-wedding-email")
}
```

---

### Next.js UI — Email Studio Tab

Add an **Email Studio** tab to the Wedding Steward dashboard, alongside the existing tabs (Guest List, Budget, Run Sheet, etc.).

**Route:** `/dashboard/[weddingId]/email-studio`

**Page structure:**

```
/app/dashboard/[weddingId]/email-studio/
  page.tsx                        — Email Studio root; renders EmailStudioLayout
  components/
    EmailStudioLayout.tsx         — Three-column layout: sidebar, compose area, preview panel
    EmailTypeSidebar.tsx          — List of 6 email types with status badges (Draft / Sent / Scheduled)
    PalettePicker.tsx             — Four swatches that update preview in real-time
    ComposePanel.tsx              — Subject, recipient picker, personal note, custom content
    RecipientSelector.tsx         — Multi-select from guest list with filter (RSVP status, tags, all)
    EmailPreviewPanel.tsx         — Live iframe/div preview of the rendered HTML
    CampaignHistoryList.tsx       — Past sent campaigns with open stats
    SendConfirmModal.tsx          — Review modal before final send (subject, count, from address)
    SendProgressBar.tsx           — Real-time send progress as mutation streams results
```

**Key behaviors:**

- **Recipient Selector** pulls from the existing `guests` table. Predefined filters: All Guests, Attending (RSVP yes), Awaiting RSVP, Specific Tags. Manual email entry also supported for non-guest recipients.
- **Live Preview** re-renders whenever any field (palette, couple names pulled from the wedding record, note, custom content) changes. Wedding details (names, date, venue, etc.) are pre-populated from the wedding record — no re-entry needed.
- **Campaign History** shows all past `EmailCampaign` records for this wedding with sent count, date, and status badge. Clicking a past campaign shows its send records and any failures.
- **Draft saving** — all compose fields auto-save to an `EmailCampaign` record with `status: 'draft'` on blur or change (debounced 2s).
- **Send flow:** User clicks Send → `SendConfirmModal` shows summary → user confirms → `sendWeddingEmail` mutation fires → `SendProgressBar` shows live progress → on completion, campaign record updates to `status: 'sent'` and history list refreshes.

---

### Access Control

Follow the existing Wedding Steward role model:

| Role | Access |
|---|---|
| `couple` (owner) | Full access — compose, send, view history |
| `planner` | Full access — same as couple |
| `guest` | No access to Email Studio |
| `vendor` | No access to Email Studio |

Use existing Amplify Auth group checks and AppSync `@auth` rules consistent with the rest of the app.

---

### UI/UX Design Notes

Adhere to the Wedding Steward design system (Tailwind + shadcn/ui, garden party tokens):

- Use the app's existing blush/sage/ivory color palette for the studio chrome; the email palette swatches are distinct from the app's own colors
- Typography: existing app fonts for UI chrome; email previews use Georgia serif to match the email templates
- The preview panel should render the email HTML in a sandboxed `<iframe>` or a `dangerouslySetInnerHTML` div with pointer-events disabled, sized to approximate a 600px email viewport
- On mobile (< 768px), collapse to a tab-based view: Type → Compose → Preview → Send
- Empty state for Campaign History: illustration of an envelope with "No emails sent yet — your first send will appear here."

---

### Integration Points

- **RSVP Flow:** When a guest submits an RSVP, the existing RSVP confirmation email (if implemented separately) is distinct from these campaign emails. The RSVP Reminder campaign here targets guests who have *not yet* responded, using the `rsvp_responses` table to filter.
- **Wedding Details:** All couple names, date, venue, and website fields are sourced from the `weddings` table record — the Email Studio reads these automatically; the couple does not re-enter them.
- **Ivy (AI Assistant):** If Ivy is available in the dashboard, surface a prompt suggestion in the compose area: *"Ask Ivy to help write a personal note"* — clicking it opens the Ivy panel with the current email type pre-loaded as context.

---

### Acceptance Criteria

- [ ] All six email types render correctly in Gmail, Apple Mail, and Outlook (test via Litmus or manual)
- [ ] All four color palettes apply correctly to all six templates
- [ ] Recipient selector correctly filters from live guest data
- [ ] `sendWeddingEmail` mutation sends via SES and writes send records
- [ ] Campaign history persists across sessions
- [ ] Draft auto-save works without user action
- [ ] Send confirm modal shows accurate recipient count before sending
- [ ] Role-based access prevents guest/vendor access to Email Studio
- [ ] Mobile layout collapses gracefully

---

### Reference

The email HTML templates and four-palette design were prototyped in the standalone Wedding Email Studio tool (see `wedding_email_studio.html`). The Lambda template engine should produce functionally equivalent output — inline styles, same structure, same palette values — so the live preview in the dashboard matches what recipients receive.
