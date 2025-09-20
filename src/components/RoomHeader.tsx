// src/components/RoomHeader.tsx

'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ClockIcon, ShareIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Room } from '@/types/room';
import type { SearchPlatform } from './RoomClient';

// SVG components for the logos
const YouTubeLogo = () => (
  <svg viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-auto">
    <path d="M27.344 3.094c-.312-1.156-.937-2.03-2.093-2.343C23.219 0 14 0 14 0S4.78 0 2.75 0.75C1.593 1.062.968 1.937.656 3.094 0 5.28 0 10 0 10s0 4.72.656 6.906c.312 1.156.937 2.032 2.093 2.344C4.78 20 14 20 14 20s9.219 0 11.25-.75c1.156-.313 1.781-1.188 2.093-2.344C28 14.72 28 10 28 10s0-4.72-.656-6.906z" fill="#FF0000"></path>
    <path d="M11.25 14.375V5.625l7.5 4.375-7.5 4.375z" fill="#FFFFFF"></path>
  </svg>
);

// ✨ UPDATED: New, solid Twitch "Glitch" icon
const TwitchLogo = () => (
  <svg role="img" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
    <path d="M3.793 0L0 3.793V24.207H6.322V28L10.115 24.207H15.655L24 15.862V0H3.793Z" fill="#9146FF" />
    <path d="M18.069 12.621H15.931V6.897H18.069V12.621Z" fill="#FFFFFF"/>
    <path d="M12.431 12.621H10.293V6.897H12.431V12.621Z" fill="#FFFFFF"/>
  </svg>
);


const URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be|twitch\.tv)\/.+$/;

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');
  if (hrs > 0) return `${String(hrs).padStart(2, '0')}:${paddedMins}:${paddedSecs}`;
  return `${paddedMins}:${paddedSecs}`;
}

export default function RoomHeader({
  roomData,
  timeLeft,
  roomId,
  onSearch,
  searchPlatform,
  setSearchPlatform,
}: {
  roomData: Room;
  timeLeft: number;
  roomId: string;
  onSearch: (query: string) => void;
  searchPlatform: SearchPlatform;
  setSearchPlatform: (platform: SearchPlatform | ((prev: SearchPlatform) => SearchPlatform)) => void;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const handleShare = async () => {
    const urlToCopy = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setIsCopied(true);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    if (URL_REGEX.test(value)) {
      onSearch(value);
    } else if (value.trim() === '') {
      onSearch('');
    }
  };

  const togglePlatform = () => {
    setSearchPlatform(prev => (prev === 'youtube' ? 'twitch' : 'youtube'));
    setSearchInput('');
  };

  return (
    <div className="w-full grid grid-cols-3 items-center gap-6 px-4 py-3 mb-4 border-b border-gray-800">
      {/* Left: Room Name & Timer */}
      <div className="flex items-center gap-4 justify-start">
        <h1 className="text-2xl font-bold text-white truncate" title={roomData.roomName}>
          {roomData.roomName}
        </h1>
        <div className="flex items-center gap-2 bg-amber-900/50 text-amber-300 px-3 py-1.5 rounded-lg">
          <ClockIcon className="w-5 h-5" />
          <span className="font-mono text-lg font-semibold tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg justify-self-center flex items-center gap-2">
        {/* ✨ UPDATED: Button now has a fixed size to prevent layout shifts */}
        <button
          type="button"
          onClick={togglePlatform}
          title={`Switch to ${searchPlatform === 'youtube' ? 'Twitch' : 'YouTube'}`}
          className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-lg bg-gray-800 border-2 border-gray-700/50 hover:border-gray-600 transition-colors"
        >
          {searchPlatform === 'youtube' ? <YouTubeLogo /> : <TwitchLogo />}
        </button>

        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search on ${searchPlatform}...`}
            value={searchInput}
            onChange={handleSearchInputChange}
            className="w-full h-11 bg-gray-800 border-2 border-gray-700/50 rounded-lg pl-11 pr-4 text-white placeholder-gray-500 transition-colors duration-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </form>

      {/* Right: Share Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleShare}
          disabled={isCopied}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isCopied
              ? 'bg-green-600 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isCopied ? ( <><CheckIcon className="w-5 h-5" /><span>Copied!</span></> ) : ( <><ShareIcon className="w-5 h-5" /><span>Share</span></> )}
        </button>
      </div>
    </div>
  );
}