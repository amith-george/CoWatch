'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/utils/socket';

// Define the props for the multi-purpose modal
interface NameBoxProps {
  mode: 'join' | 'update';
  onConfirm: (username: string) => void;
  roomId: string;
  currentUsername?: string | null;
  onClose?: () => void;
}

export default function NameBox({
  mode,
  onConfirm,
  roomId,
  currentUsername,
  onClose,
}: NameBoxProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pre-fill the input if we are in 'update' mode
    if (mode === 'update' && currentUsername) {
      setName(currentUsername);
    }
  }, [mode, currentUsername]);

  useEffect(() => {
    // Listen for socket error events
    const handleError = (data: { message: string }) => {
      setError(data.message);
      setIsLoading(false);
    };

    socket.on('error', handleError);

    // Listen for membersUpdate to confirm username update
    if (mode === 'update') {
      const handleMembersUpdate = (data: { members: { userId: string; username: string; role: string }[] }) => {
        const userId = localStorage.getItem('userId');
        const member = data.members.find((m) => m.userId === userId);
        if (member && member.username === name.trim()) {
          onConfirm(member.username);
          setIsLoading(false);
        }
      };

      socket.on('membersUpdate', handleMembersUpdate);

      return () => {
        socket.off('error', handleError);
        socket.off('membersUpdate', handleMembersUpdate);
      };
    }

    return () => {
      socket.off('error', handleError);
    };
  }, [mode, name, onConfirm]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Name cannot exceed 20 characters.');
      return;
    }

    setIsLoading(true);

    if (mode === 'join') {
      // FIX: Changed 'let' to 'const' as userId is never reassigned.
      const userId = localStorage.getItem('userId');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/rooms/${roomId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, username: trimmed }),
        });
        const data = await res.json();
        if (res.ok) {
          onConfirm(trimmed);
        } else if (data.message?.includes('Username already taken')) {
          setError('This username is already taken in the room. Please choose another.');
        } else {
          setError(data.message || 'Failed to join room');
        }
      } catch (err) {
        console.error('Join error', err);
        setError('Failed to join. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else { // mode === 'update'
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found. Please try again.');
        setIsLoading(false);
        return;
      }
      socket.emit('updateUsername', { roomId, userId, newUsername: trimmed });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  // Dynamically set UI text based on the mode
  const title = mode === 'join' ? 'Welcome!' : 'Update Your Name';
  const label = mode === 'join' ? 'Pick a nickname' : 'Enter new name';
  const placeholder = mode === 'join' ? 'Enter your name' : 'New name';
  const infoText = mode === 'join' ? 'This name will be visible to others in the room. No account needed.' : 'Your new name will be visible to everyone.';
  const buttonText = mode === 'join' ? 'Join the Room' : 'Update Name';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose} // Allow closing by clicking the backdrop
    >
      <div
        className="bg-[#1f1f1f] text-white p-8 rounded-lg shadow-2xl w-[90%] max-w-lg pointer-events-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing the modal
      >
        <h2 className="text-2xl font-bold mb-2">
          {mode === 'join' ? (
            <>
              Welcome to <span className="text-white">Co</span><span className="text-yellow-400">Watch</span>!
            </>
          ) : (
            title
          )}
        </h2>
        <hr className="border-gray-600 mb-6" />

        <label htmlFor="nickname" className="block text-sm font-bold mb-2">
          {label}
        </label>
        <input
          id="nickname"
          type="text"
          className={`w-full bg-[#2c2c2c] text-white border rounded-md px-4 py-3 mb-2 focus:outline-none focus:ring-2 transition-colors ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-yellow-400'
          }`}
          placeholder={placeholder}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          maxLength={20}
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <p className="text-sm text-gray-400 mb-6">{infoText}</p>
        <button
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-md transition disabled:bg-gray-500 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={isLoading || !name.trim() || name.trim().length < 2 || name.trim().length > 20}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}