'use client';

import { useEffect } from 'react';

// Rests the motion of every section that is off screen. A CSS animation keeps the browser at work wherever
// it is on the page: with the page standing still at its top, that took 42% of the main thread at a phone's
// size and 72% at a desktop's. A section is marked `data-away` until it is within a quarter of a screen of
// view, and globals.css pauses what is inside a marked one. With no script nothing is marked and all of it runs.
export function Away() {
  useEffect(() => {
    const watching = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.toggleAttribute('data-away', !entry.isIntersecting)), {
      rootMargin: '25% 0px',
    });
    document.querySelectorAll('main section, [data-footer]').forEach((part) => watching.observe(part));
    return () => watching.disconnect();
  }, []);
  return null;
}
