import { useEffect, useState, useRef, useCallback } from 'react';

export function useCountdown(expiry?: string, onExpire?: () => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // FIX: Wrapped the helper function in useCallback.
  // This memoizes the function, so it only gets recreated when 'expiry' changes.
  const calculateTimeLeft = useCallback(() => {
    if (!expiry) return 0;
    const difference = +new Date(expiry) - +new Date();
    return difference > 0 ? Math.floor(difference / 1000) : 0;
  }, [expiry]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimeLeft(calculateTimeLeft());

    intervalRef.current = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onExpire?.();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // FIX: Added the 'calculateTimeLeft' function to the dependency array.
  }, [expiry, onExpire, calculateTimeLeft]);

  return timeLeft;
}