# Part B features #10, #13, #20, #21: decisions and ops notes

## New schema (all additive)
- `Guest.emailOptOut`, `WebsiteConfig.seatFinderEnabled` (default false), `Vendor.arrivedAt`.
- `SendEmailResult.skippedOptOut`.
- `VendorTask` model: owners have full access, readers can only read. Indexed by weddingId and vendorId.
- `ServeAccess` model: owner-only. Fields `token` (index `byServeToken`) and `enabled` (default false). The token is kept off `Wedding` because Wedding can be read with the API key.
- New custom mutations:
  - Internal key: `findSeat`, `getServeCard`, `unsubscribeGuest`, `requestDataDeletion`.
  - Authenticated: `setVendorTaskDone`, `vendorCheckIn`.
  - All of them run in the `public-site` Lambda.

## Decisions
- **Schedule** (`/w/[slug]/schedule`):
  - Shows only run-sheet items with `isPublic`. Rendered on the server; the client calls `router.refresh()` every 60s.
  - "Now / Up next" uses the device clock and only appears on the wedding date.
- **Seat finder:**
  - `/api/website/find-seat` allows 10 requests, refilling at 5/min per IP, and respects the site password.
  - It needs a full name. It returns only the table name and tablemates' first names.
  - Off unless the toggle under Website > Domain > "Day-of Pages" is on.
- **VendorTask:**
  - Planner creates tasks with owners = wedding owners and readers = `vendor.readers`.
  - Vendors tick tasks via `setVendorTaskDone`, which checks Vendor.readers plus the profile vendorId, and only sets isDone/doneAt/doneBy.
  - Check-in uses `vendorCheckIn`, which sets `arrivedAt`.
  - The hard-coded demo "action items" in the portal were replaced.
- **Scan-to-serve:**
  - Opt-in toggle on the Seating page. The token is 192-bit random and can be rotated ("New code").
  - `/serve/[token]/[guestId]` is server-rendered. It needs no rate limit because the token can't realistically be guessed.
  - It works from the wedding date minus 1 day to plus 1 day.
  - Plus-ones without a tableId fall back to their primary guest's table.
  - Place cards print as a Letter PDF, 4 tent cards per page. The QR code is included only while serving is enabled.
- **Unsubscribe:**
  - The link is an HMAC token signed with `INTERNAL_API_SECRET`. The `/unsubscribe` page only unsubscribes when the guest clicks, so link scanners don't trigger it.
  - Opted-out guests are skipped in Email Studio (both client and Lambda) and in RSVP confirmations.
- **Delete guest and all data** (client, owners only): deletes the guest, plus-ones, guestbook entries matched by name (plus their media), and EmailSendRecords. RSVP answers live on the Guest record, so they go with it.
- **Data deletion request:** a form on the public privacy page sends an SES email to the couple, with ReplyTo set to the guest.
- `/privacy` is a generic policy. It's linked from the landing footer, the public site footer and the RSVP form.

## Deploy notes
- `sendWeddingEmail` now needs the `INTERNAL_API_SECRET` secret (it's already set for public-site) and `ROOT_DOMAIN`.
- New DynamoDB tables (VendorTask, ServeAccess) and IAM grants are created on deploy.
