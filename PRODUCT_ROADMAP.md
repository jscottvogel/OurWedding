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

---

## 11. Post-Event Workflows & Retention (Thank-You Cards & Anniversaries)
The user lifecycle shouldn't end when the wedding ceremony is over. Premium platforms help transition the relationship post-event.

* **Automated Thank-You Card Writer**:
  * Sync the guest list and the registry database (Stripe/Affiliates) into a "Thank-You Checklist".
  * Automatically cross-reference who sent which gift (e.g., *"John Doe sent a $100 contribution to the honeymoon flights"*).
  * Use AI to draft a personalized thank-you note referencing the exact gift.
  * Allow printing and shipping physical cards directly from the portal, matching the theme of their invitations.
* **Anniversary Reminders & Legacy Pages**:
  * Transition the wedding website into an "Anniversary & Legacy Page" (archiving photos, guest wishes, and wedding details).
  * **Anniversary Pricing Tier**: Downgrade the active subscription plan to a low-cost legacy maintenance tier (set at **$1.00 to $2.00 per month** or **$12.00 per year**) to keep the custom domains, media storage, and online galleries active while strictly covering server/storage overhead.
  * Send yearly notifications with recommendations for anniversary gifts, travel getaways, or local date ideas.

---

## 12. Group Gifting & Registry Gift Tracking
To accommodate large-ticket registry items, guests need collaborative ways to buy gifts.

* **Group Gifting (Crowdfunding)**:
  * Allow couples to tag expensive items (e.g. a $1,500 espresso machine or a $3,000 honeymoon fund) for Group Gifting.
  * Guests can contribute partial amounts (e.g., $50, $100) toward the target price, with progress bars showing remaining goals.
* **Registry Gift Tracker Dashboard**:
  * A comprehensive dashboard for the couple tracking which gifts were purchased, who bought them, and when they were delivered.
  * Integrate thank-you card templates directly next to each completed transaction.

---

## 13. Day-of Live Timelines & Seating Previews
Help guests navigate the wedding day smoothly by turning the static website layout into a dynamic, real-time app.

* **Live Schedule/Run Sheet updates**:
  * If the wedding schedule gets delayed or shifts (e.g. dinner is delayed 20 minutes), the couple or planner can push an update.
  * The public wedding website/guest portal schedule shifts in real-time, accompanied by SMS/Push notifications.
* **Public Floor Plan & Seating Previews**:
  * Allow guests to view the floor plan and search for their seats on their mobile phones when they arrive at the venue.
  * Map guests' table placements so they can easily find their table location in a large ballroom.

---

## 14. Virtual Attendance & Live Stream Integration
For remote guests who cannot travel, a world-class platform offers a seamless way to participate in the ceremony live.

* **Embedded Live Stream Player**:
  * Support embedding YouTube Live, Vimeo, Zoom, or custom RTMP feeds directly onto the public site homepage or a designated `/live` tab.
* **Virtual Guestbook & Interactive Chat**:
  * Provide a real-time chat window alongside the video player so virtual guests can congratulate the couple and chat with other remote attendees.
  * Log the virtual chat messages automatically into the couple’s Digital Guestbook.

---

## 15. AI Speech & Toast Assistant (Viral Engagement Tool)
To drive high engagement among the bridal party and close friends, the app can offer writing help tools.

* **AI Toast Writer (Ask Ivy)**:
  * Best man, maid of honor, or parents can use the tool to draft speeches.
  * Ivy prompts the user with short, targeted questions (e.g., *"How did you meet the groom?"*, *"What's a funny/favorite memory?"*, *"Describe the bride in three words"*).
  * Ivy generates a professionally structured, touching, or humorous speech with a timer estimate.
* **AI Table Ice-breaker Cards**:
  * Couples can auto-generate customized conversation cards for tables.
  * Ivy scans guest tags (e.g. "college friends", "campsite group") and prints fun prompts: *"Ask Table 4 how they know the groom from University of Texas, or ask Sarah about the camping trip in 2021."*

---

## 16. Stripe Fee Sponsorship (Registry Fee Transparency)
When guests send cash gifts via Stripe, transaction fees (typically 2.9% + $0.30) are deducted from the payout. World-class registries offer options to offset this.

* **Guest Fee Sponsorship Toggle**:
  * Give guests the option to check a box during Stripe checkout: *"Cover the credit card transaction fees ($X.XX) so the couple receives 100% of my gift."*
  * If checked, the payment intent adds the fee to the guest's checkout total.



