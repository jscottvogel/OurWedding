# Wedding Steward: Product Roadmap & Future Feature Gaps

This document serves as a strategic roadmap to transition Wedding Steward from a standard planning utility into a **world-class, premium wedding planning application** that competes directly with industry leaders (such as Zola, Joy, and The Knot).

---

## 1. Interactive Venue & Floor Plan Designer
The current seating chart handles guest-to-table assignments. A premium planner requires a full **interactive spatial layout designer** for venues.

* **Drag-and-Drop Floor Plan Elements**: Allow users to place and arrange tables (round, rectangular), dance floors, stages, bars, DJ booths, photo booths, and buffet lines on a canvas.
* **Scale & Dimensions**: Enable couples to input venue dimensions (e.g., 50' x 80') to scale the canvas accurately, ensuring adequate spacing between tables.
* **Caterer & Service Overlay Views**: 
  * Toggle options that color-code tables by meal selection (e.g., Beef, Fish, Vegetarian).
  * Highlight seats with severe dietary restrictions (e.g., gluten-free, nut allergies) so catering teams can print table-by-table service sheets directly.

---

## 2. Advanced AI Capabilities (Ask Ivy Enhancements)
Leveraging the existing Bedrock backend integration, we can implement high-value AI features that solve tedious manual tasks.

* **AI Seating Assistant**: Automate table assignments using custom rules:
  * *"Seat college friends together."*
  * *"Ensure grandparents are seated away from the DJ speakers."*
  * *"Seat bride's immediate family close to the head table."*
* **AI Vendor Contract Auditor**: Couples upload vendor PDF contracts (e.g., caterer, venue, photographer), and Ask Ivy:
  * Extracts deposit dates and payment deadlines, automatically feeding them into the **Budget** tracker.
  * Adds deliverables and milestones to the **Checklist**.
  * Highlights critical clauses such as cancellation policies or liability limits.
* **AI RSVP Auto-Summarization**: Generate quick briefings of song requests, dietary needs, and couple messages for distribution to the chef and DJ.

---

## 3. Personalized Guest Portals & Live Event Feeds
Shifting the guest experience from static RSVP forms to interactive, passwordless personal portals.

* **Magic Link Authentication**: Send secure, single-use login links to guests via email/SMS.
* **Personalized Event Schedules**: Guests only see events they are invited to.
  * Rehearsal dinner details are displayed for the wedding party/immediate family.
  * General ceremony details are shown for all others.
* **Live Reception Photo Feed**: 
  * Guests scan a QR code at their table to upload photos taken during the event.
  * Uploads immediately stream to a live slideshow screen at the venue and save directly to the couple's Shared Gallery.
* **Multimedia Guestbook**: Support audio recordings (voicemail-style) or short video wishes uploaded directly from mobile devices.

---

## 4. Multi-User Collaboration & Granular Permissions
Weddings involve many stakeholders (planners, family members, maid of honor, vendors) who require varying levels of access.

* **Professional Planner Co-Management**: Invite professional planners to co-manage check-lists, run sheets, and layout plans.
* **Privacy and View Controls**: Restrict sensitive data. For example, hide budget totals from standard vendors or bridal party members while giving them access to the schedule.
* **Vendor Portal Logins**: Grant direct, read-only dashboard access to vendors (e.g., letting the DJ log in to see the playlist requests, or the venue manager view the seating chart).

---

## 5. Automated Guest Messaging & Calendar Sync
Chasing down RSVPs and coordinating schedules is the most time-consuming part of planning.

* **Integrated SMS Campaigns**: Add texting capabilities to Email Studio for immediate, high-engagement updates (e.g., RSVP deadline reminders or hotel cutoff alerts).
* **Automated RSVP Reminders**: Set cron schedules to auto-remind guests who have not responded as deadlines approach.
* **Calendar Integrations**: Sync the Checklist deadlines and Run Sheet events directly with Google Calendar, Apple Calendar, and Outlook.

---

## 6. Progressive Web App (PWA) & Mobile Polish
A premium app must perform flawlessly on mobile devices, especially on the wedding day.

* **Offline Functionality**: Store the Run Sheet, guest contact lists, and vendor details locally on the device so it remains accessible in venues with poor signal/Wi-Fi.
* **Push Notifications**: Send real-time scheduling updates to the bridal party and vendors on the day of the event (e.g., *"Bridal portraits starting in the garden in 5 minutes"*).

---

## 7. Organic Growth Loops & Viral Mechanics
To lower user acquisition costs (CAC) to near-zero, the app needs built-in referral mechanisms that turn active users' networks into future customers.

* **Guest-to-User Conversion Loop**:
  * Include subtle, premium "Created with Wedding Steward" signatures in public wedding footers, RSVP completion pages, and email notification templates.
  * Provide a single-click "Start Planning Your Wedding" banner tailored for engaged guests viewing the website.
* **Vendor Referral Ecosystem**:
  * Introduce wedding vendors (venue coordinators, DJs, florists) to the product when they log in to view schedules or layouts.
  * Offer co-branded portals or premium referrals where vendors can recommend Wedding Steward to their next clients in exchange for priority listing in a local directory.

---

## 8. Physical-to-Digital Bridge (Paper Goods & Logistics)
A world-class app bridges the gap between digital planning and physical coordination.

* **Address Collection Campaigns**:
  * Provide a simple "Address Collector" tool where couples can generate a personal link and text it to guests.
  * Guests enter their physical addresses, which instantly populate the guest database.
* **Physical Invitation Integration**:
  * Partner with a printing service (e.g., Printful, Lob) to allow couples to design their Save-the-Dates and invitations in the app.
  * Automate printing, envelope addressing (using the guest list database), stamping, and direct mailing.
* **Place-card & Seating Printables**:
  * Auto-generate print-ready PDFs for dinner table place-cards based on table assignments.
  * Include markers on place-cards reflecting guest meal choices (e.g., a small cow icon for beef, fish for seafood) for waitstaff convenience.

---

## 9. Monetization Channels & Affiliate Registries
Beyond premium subscription tiers, the app can generate substantial passive income through affiliate and commission partnerships.

* **Retail Registry Integrations**:
  * Integrate affiliate links for major registries (e.g., Amazon, Target, Wayfair, Crate & Barrel).
  * Earn 3–8% commission on gift purchases made through the wedding website registry links.
* **Curated Vendor Marketplace**:
  * Create a local marketplace where couples can search and book planners, photographers, and caterers.
  * Charge vendors a directory listing fee or take a booking finder's fee on contracts initiated through the platform.

---

## 10. Privacy, Compliance & Security Polish
Because the platform collects sensitive personal information (emails, addresses, phone numbers, and child guest counts), it must adhere to world-class security standards.

* **GDPR & CCPA Compliance**:
  * Allow guests to request deletion of their personal information (right to be forgotten).
  * Build an automated "Opt-Out" workflow in email and SMS campaigns.
* **Granular Data Encryption**: Encrypt sensitive guest address fields and dietary notes at rest to ensure client security.

