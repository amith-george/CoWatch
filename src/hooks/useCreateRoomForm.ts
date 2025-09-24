'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define the shape of validation errors
interface FormErrors {
  name?: string;
  room?: string;
}

export function useCreateRoomForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [duration, setDuration] = useState(20); // default in minutes
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    // --- Validation ---
    const trimmedName = name.trim();
    const trimmedRoom = roomName.trim();
    const currentErrors: FormErrors = {};

    if (!trimmedName || /\s/.test(trimmedName)) {
      currentErrors.name = 'A valid name without spaces is required.';
    }
    if (!trimmedRoom || /\s/.test(trimmedRoom) || trimmedRoom.length > 20) {
      currentErrors.room = 'Room name must be 1-20 characters without spaces.';
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    // --- API Call ---
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
      localStorage.setItem('userId', userId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: userId, username: trimmedName, roomName: trimmedRoom, duration }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/room/${data.room.roomId}`); 
      } else {
        setServerError(data.message || 'Failed to create room.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setServerError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return {
    name,
    setName,
    roomName,
    setRoomName,
    duration,
    setDuration,
    isLoading,
    errors,
    serverError,
    handleSubmit,
  };
}