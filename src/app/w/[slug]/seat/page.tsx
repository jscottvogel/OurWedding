import type { Metadata } from 'next';
import { SeatFinder } from './SeatFinder';

export const metadata: Metadata = {
  title: 'Find Your Seat',
  description: 'Look up your table at the reception.',
  robots: { index: false, follow: false },
};

/** Public seat finder. Gated server-side by WebsiteConfig.seatFinderEnabled (findSeat op). */
export default function SeatPage({ params }: { params: { slug: string } }) {
  return <SeatFinder slug={decodeURIComponent(params.slug)} />;
}
