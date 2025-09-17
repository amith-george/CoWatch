// src/hooks/useScrollLock.ts

import { useEffect } from 'react';

// Selectors for elements that should be allowed to scroll
const SCROLLABLE_SELECTORS = [
  '.chat-messages-container',
  '.search-results-container',
  '[class*="overflow-y-auto"]'
].join(', ');

/**
 * Prevents the main page body from scrolling while allowing specific child elements to scroll.
 */
export const useScrollLock = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.scrollRestoration = 'manual';
    
    const preventDefault = (e: Event) => e.preventDefault();

    const handleScrollEvent = (e: Event) => {
      const target = e.target as Element;
      // If the event target is inside a scrollable container, do nothing.
      if (target.closest(SCROLLABLE_SELECTORS)) {
        return;
      }
      // Otherwise, prevent the default scroll/touch behavior.
      e.preventDefault();
    };

    // Use a short timeout to apply the lock after initial render, preventing jitters.
    const timer = setTimeout(() => {
        window.addEventListener('wheel', handleScrollEvent, { passive: false });
        window.addEventListener('touchmove', handleScrollEvent, { passive: false });
        // A stricter lock on the document scroll itself
        document.addEventListener('scroll', preventDefault, { passive: false });
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('wheel', handleScrollEvent);
      window.removeEventListener('touchmove', handleScrollEvent);
      document.removeEventListener('scroll', preventDefault);
    };
  }, []);
};