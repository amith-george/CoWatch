import { useEffect, useState, useRef } from 'react';

export function useCountdown(expiry?: string, onExpire?: () => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // 💡 FIX 1: Start with `null` to represent a "loading" or "not yet calculated" state.
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Always clear any previous timer when the expiry date changes.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // 💡 FIX 2: If the expiry date hasn't loaded yet, do nothing.
    // This is the key fix that prevents the immediate expiration.
    if (!expiry) {
      setTimeLeft(null); // Ensure time is null if there's no expiry date
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(expiry) - +new Date();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    // 💡 FIX 3: Only expire or start the timer if the initial calculation is done.
    if (initialTime <= 0) {
      onExpire?.(); // The room is genuinely expired, so call the function.
      return;
    }

    // If the time is valid, start the countdown.
    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        // Safety check for null, although it shouldn't be null here.
        if (prevTime === null || prevTime <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Standard cleanup function.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiry, onExpire]); // This effect now correctly handles all logic.

  return timeLeft;
}