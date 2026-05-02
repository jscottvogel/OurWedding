import { NextResponse } from 'next/server';
import { sendRsvpConfirmationEmail } from '@/lib/email/rsvp-confirmation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weddingSlug, guestId, attending, plusOneName, mealChoice, dietaryNotes, guestEmail } = body;

    // Validate inputs
    if (!guestId || attending === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a full implementation:
    // 1. Fetch Guest by guestId using admin client
    // 2. Verify wedding is published and RSVP deadline hasn't passed
    // 3. Update Guest record with rsvpStatus = 'RESPONDED', attending, etc.
    // 4. Send SES email

    // Mock successful database update
    console.log(`Updated RSVP for guest ${guestId}`);

    // Send confirmation email
    if (guestEmail) {
      await sendRsvpConfirmationEmail({
        toEmail: guestEmail,
        guestName: "Guest", // Would be fetched from DB
        attending,
        weddingSlug
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RSVP Submit Error:', error);
    return NextResponse.json({ error: 'Failed to process RSVP' }, { status: 500 });
  }
}
