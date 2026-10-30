import Link from 'next/link';
import { DataDeletionRequestForm } from './PrivacyNotice';

const UPDATED = '30 October 2026';

/** Generic privacy policy shared by /privacy and /w/[slug]/privacy. */
export function PrivacyPolicy({ slug, showHomeLink = true }: { slug?: string; showHomeLink?: boolean }) {
  return (
    <div className="min-h-screen bg-ivory">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-display text-charcoal mb-2">Privacy Policy</h1>
        <p className="text-sm text-mid-gray mb-10">Last updated {UPDATED}</p>

        <div className="space-y-8 text-charcoal/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-display text-sage mb-2">Who we are</h2>
            <p>
              Wedding Steward is a planning tool used by couples and their planners. When a couple invites you to
              their wedding, <strong>the couple decides what information is collected about you</strong> and is
              responsible for it. Wedding Steward stores and processes it on their behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-sage mb-2">What we collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Guest details the couple adds: name, email, phone, address, party and table.</li>
              <li>What you tell us when you RSVP: attendance, meal choice and dietary requirements.</li>
              <li>Guestbook messages, photos and other uploads you choose to share.</li>
              <li>Basic, anonymous site analytics (page view counts). We don&apos;t sell data or use ad trackers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-display text-sage mb-2">How it&apos;s used</h2>
            <p>
              Only to help the couple run their wedding: managing RSVPs, seating, catering, and sending you wedding
              updates. Dietary information is shared with the couple&apos;s caterer only as needed to serve you.
              Seat-finder and place-card pages, when the couple turns them on, show only first names, tables and
              meal details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-sage mb-2">Emails</h2>
            <p>
              Every email we send to guests includes an unsubscribe link. Once you unsubscribe, the couple&apos;s
              emails from Wedding Steward will no longer be sent to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-sage mb-2">Storage and retention</h2>
            <p>
              Data is stored with Amazon Web Services and protected so that only the couple and the people they
              invite can see it. It&apos;s kept for as long as the couple keeps their wedding account, and removed
              when they delete the guest or the account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display text-sage mb-2">Your rights</h2>
            <p>
              You can ask to see, correct or delete your information. Because the couple controls their guest list,
              the quickest route is to ask them directly{slug ? ' or use the form below' : ''}. They can permanently
              delete your guest record, any plus-ones and your guestbook entries in one step.
            </p>
          </section>
        </div>

        {slug && (
          <div className="mt-12">
            <DataDeletionRequestForm slug={slug} />
          </div>
        )}

        {showHomeLink && (
          <p className="mt-12 text-sm">
            <Link href="/" className="text-sage underline hover:text-dark-sage">Back to Wedding Steward</Link>
          </p>
        )}
      </main>
    </div>
  );
}
