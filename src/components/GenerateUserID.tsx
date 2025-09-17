'use client';

import { useEffect } from 'react';

export default function InitUserId() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingId = localStorage.getItem('userId');
    if (!existingId) {
      const newId = 'anon-' + crypto.randomUUID().slice(0, 8);
      localStorage.setItem('userId', newId);
    }
  }, []);

  return null; // nothing visible
}
