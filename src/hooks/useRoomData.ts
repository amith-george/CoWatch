import { useEffect, useState } from 'react';
import { Room } from '@/types/room';

export function useRoomData(roomId: string) {
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const fetchRoom = async () => {
      try {
        let storedUserId = typeof window !== 'undefined'
          ? localStorage.getItem('userId')
          : null;

        if (!storedUserId && typeof window !== 'undefined') {
          storedUserId = 'anon-' + crypto.randomUUID().slice(0, 8);
          localStorage.setItem('userId', storedUserId);
        }

        setUserId(storedUserId);

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/rooms/${roomId}`);
        const data = await res.json();

        if (res.ok) {
          setRoomData(data.room);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch room data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  return { roomData, userId, loading, error };
}
