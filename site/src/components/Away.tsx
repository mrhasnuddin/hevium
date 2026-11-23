'use client';

import { useEffect } from 'react';

// Rests the motion of every section that is off screen. A CSS animation keeps the browser at work wherever
// it is on the page: with the page standing still at its top, that took 42% of the main thread at a phone's
// size and 72% at a desktop's. A section is marked `data-away` until it is within a quarter of a screen of
// view, and globals.css pauses what is inside a marked one. With no script nothing is marked and all of it runs.
// The parts that have an entrance: every head, and each section's piece.
const ENTER = '.section-head, #problem, [data-tabs], [data-ring], #launch figure, [data-session], [data-cards], #chains figure, [data-bento] > li, #faq, #final';

export function Away() {
  useEffect(() => {
    const watching = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.toggleAttribute('data-away', !entry.isIntersecting)), {
      rootMargin: '25% 0px',
    });
    document.querySelectorAll('main section, [data-footer]').forEach((part) => watching.observe(part));

    // Entrances (app/entrances.css). A part that is below the screen when the page starts is held back
    // (`data-enter`) and let in the first time it comes up (`data-seen`). What is in view already, or has
    // been passed, stands as it is. The hold is taken off once the entrance has played, so the part's own
    // transitions are its own again.
    const entering = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entering.unobserve(entry.target);
          entry.target.setAttribute('data-seen', '');
          setTimeout(() => entry.target.removeAttribute('data-enter'), 1800);
        }),
      { rootMargin: '0px 0px -12% 0px' },
    );
    if ('motion' in document.documentElement.dataset) {
      document.querySelectorAll(ENTER).forEach((part) => {
        // a tab that is put away has no place yet: it waits for its turn like a part below the screen
        if (part.getClientRects().length > 0 && part.getBoundingClientRect().top < innerHeight * 0.88) return;
        part.setAttribute('data-enter', '');
        entering.observe(part);
      });
    }
    return () => {
      watching.disconnect();
      entering.disconnect();
    };
  }, []);
  return null;
}
