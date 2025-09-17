// src/hooks/useInvitePrompt.ts

import { useState, useEffect } from 'react';

export const useInvitePrompt = (roomId: string) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // We must check for `window` because this runs on the server initially.
    if (typeof window !== 'undefined') {
      const seenInvite = sessionStorage.getItem(`inviteShown-${roomId}`);
      setIsVisible(!seenInvite);
    }
  }, [roomId]);

  const closePrompt = () => {
    sessionStorage.setItem(`inviteShown-${roomId}`, 'true');
    setIsVisible(false);
  };

  return { isInviteVisible: isVisible, closeInvitePrompt: closePrompt };
};