'use client';

import { useEffect, useState } from 'react';

export default function NameBox({
  onJoin,
  roomId,
}: {
  onJoin: (username: string) => void;
  roomId: string;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleJoin = async () => {
    const trimmed = name.trim();
    // Add validation to prevent submission if name is empty
    if (!trimmed || trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
     if (trimmed.length > 20) {
      setError('Name cannot exceed 20 characters.');
      return;
    }


    let userId = localStorage.getItem('userId');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API}/rooms/${roomId}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            username: trimmed,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        onJoin(trimmed);
      } else if (data.message?.includes('Username already taken')) {
        setError('This username is already taken in the room. Please choose another.');
      } else {
        setError(data.message || 'Failed to join room');
      }
    } catch (err) {
      console.error('Join error', err);
      setError('Failed to join. Please try again.');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevents default form submission behavior
      handleJoin();
    }
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.50)' }}
    >
      <div className="bg-[#1f1f1f] text-white p-8 rounded-lg shadow-2xl w-[90%] max-w-lg pointer-events-auto animate-fade-in">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to <span className="text-white">Co</span>
          <span className="text-yellow-400">Watch</span>!
        </h2>
        <hr className="border-gray-600 mb-6" />

        <label htmlFor="nickname" className="block text-sm font-bold mb-2">
          Pick a nickname
        </label>

        <input
          id="nickname"
          type="text"
          className={`w-full bg-[#2c2c2c] text-white border rounded-md px-4 py-3 mb-2 focus:outline-none focus:ring-2 transition-colors ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-yellow-400'
          }`}
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyDown={handleKeyDown} // Added event handler here
          maxLength={20}
          autoFocus
        />

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <p className="text-sm text-gray-400 mb-6">
          This name will be visible to others in the room. No account needed.
        </p>

        <button
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-md transition disabled:bg-gray-500 disabled:cursor-not-allowed"
          onClick={handleJoin}
          disabled={!name.trim() || name.trim().length < 2 || name.trim().length > 20}
        >
          Join the Room
        </button>
      </div>
    </div>
  );
}
