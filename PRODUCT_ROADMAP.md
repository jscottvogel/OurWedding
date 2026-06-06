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
