import type { Metadata } from 'next';
import { appsync, internalKey, parseAwsJson } from '@/lib/server/appsync';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Guest service card',
  robots: { index: false, follow: false },
};

interface ServeCard {
  valid: boolean;
  outsideWindow?: boolean;
  firstName?: string;
  tableName?: string | null;
  mealChoice?: string | null;
  dietary?: { vegetarian: boolean; vegan: boolean; glutenFree: boolean; nutFree: boolean };
}

const DIET_LABELS: [keyof NonNullable<ServeCard['dietary']>, string][] = [
  ['vegan', 'Vegan'],
  ['vegetarian', 'Vegetarian'],
  ['glutenFree', 'Gluten-free'],
  ['nutFree', 'Nut-free'],
];

/**
 * Scan-to-serve page for caterers (QR on place cards). Rendered on the server so the internal
 * key never leaves it. Tokens are 192-bit random values, so no rate limit is needed here; the
 * Lambda also enforces the opt-in flag and the wedding-day ±1 window.
 */
export default async function ServePage({ params }: { params: { token: string; guestId: string } }) {
  let card: ServeCard | null = null;
  try {
    const data = await appsync<{ getServeCard: unknown }>(
      `mutation GetServeCard($k: String!, $t: String!, $g: String!) { getServeCard(internalKey: $k, token: $t, guestId: $g) }`,
      { k: internalKey(), t: params.token, g: params.guestId },
    );
    card = parseAwsJson<ServeCard>(data.getServeCard);
  } catch (err) {
    console.error('getServeCard failed', err);
  }

  return (
    <main className="min-h-screen bg-ivory flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-sage/20 p-8 text-center">
        {!card ? (
          <p className="text-mid-gray">Couldn&apos;t load this card. Please try again.</p>
        ) : !card.valid ? (
          <>
            <h1 className="font-display text-2xl text-charcoal mb-2">Card not active</h1>
            <p className="text-mid-gray text-sm">
              {card.outsideWindow ? 'This code only works around the wedding day.' : 'This code is invalid or has been replaced.'}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-widest text-sage mb-1">Serving</p>
            <h1 className="font-display text-4xl text-charcoal mb-2">{card.firstName}</h1>
            {card.tableName && <p className="text-mid-gray mb-6">{card.tableName}</p>}
            <div className="text-left space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-mid-gray">Meal</p>
                <p className="text-lg font-medium text-charcoal">{card.mealChoice || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-mid-gray mb-1">Dietary</p>
                <div className="flex flex-wrap gap-2">
                  {DIET_LABELS.filter(([k]) => card!.dietary?.[k]).map(([k, label]) => (
                    <span key={k} className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">{label}</span>
                  ))}
                  {!DIET_LABELS.some(([k]) => card!.dietary?.[k]) && <span className="text-charcoal">None noted</span>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
