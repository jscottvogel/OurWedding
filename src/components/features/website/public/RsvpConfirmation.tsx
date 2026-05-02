'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function RsvpConfirmation({ attending }: { attending: boolean }) {
  useEffect(() => {
    if (attending) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
  }, [attending]);

  return (
    <section id="rsvp-confirmation" className="py-20 bg-white">
      <div className="max-w-xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-heading mb-6" style={{ color: 'var(--color-primary)' }}>
          {attending ? "You're on the list!" : "We'll miss you!"}
        </h2>
        <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 shadow-sm text-gray-700">
          <p className="text-lg">
            {attending 
              ? "Thank you! We can't wait to celebrate with you." 
              : "Thank you for letting us know. We'll miss you!"}
          </p>
          {attending && (
            <button className="mt-6 border border-sage text-sage px-6 py-2 rounded-lg font-medium hover:bg-sage hover:text-white transition-colors">
              Add to Calendar
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
