import { useEffect, useState, useRef } from 'react';

export function useCountdown(expiry?: string, onExpire?: () => void) {
  // We'll use a ref to store the interval ID to ensure we always have the latest one.
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Helper function to calculate time left
  const calculateTimeLeft = () => {
    if (!expiry) return 0;
    const difference = +new Date(expiry) - +new Date();
    return difference > 0 ? Math.floor(difference / 1000) : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Clear any existing interval when the expiry date changes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set the initial time left immediately
    setTimeLeft(calculateTimeLeft());

    // Set up the self-correcting interval
    intervalRef.current = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      // Check for expiration
      if (newTimeLeft <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onExpire?.(); // Call the expiration callback
      }
    }, 1000);

    // Cleanup function to clear the interval when the component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiry, onExpire]); // Rerun the effect if the expiry date or callback changes

  return timeLeft;
}