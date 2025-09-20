'use client';

import { useCallback } from 'react';
import { LinkIcon, PlayIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface HelperModalProps {
  onClose: () => void;
}

export default function HelperModal({ onClose }: HelperModalProps) {
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const features = [
    {
      icon: LinkIcon,
      title: 'Create & Invite',
      description: 'Paste a YouTube or Twitch link to start a room. Share the URL to invite friends—no sign-up needed!',
    },
    {
      icon: PlayIcon,
      title: 'Watch, Chat & Queue',
      description: 'Enjoy perfectly synced video controlled by the host. Chat in real-time and build a playlist together.',
    },
    {
      icon: ComputerDesktopIcon,
      title: 'Share Your Screen',
      description: 'Need to show something? One person at a time can share their screen, a specific window, or a browser tab.',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#2a2a2a] text-white p-8 rounded-lg shadow-2xl w-[90%] max-w-lg pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Welcome to <span className="text-white">Co</span><span className="text-yellow-400">Watch</span>!
          </h2>
          <p className="text-gray-300 mt-2">Watch videos and streams with anyone, perfectly in sync.</p>
        </div>
        
        <hr className="border-gray-600 my-6" />

        <div className="space-y-5 text-left">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-gray-700/50 p-2 rounded-lg mt-1">
                <Icon className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="text-sm text-gray-300">{description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-6">
          Your room and all messages are temporary and private. Enjoy the show! 🍿
        </p>

        <button
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-6 rounded-md transition mt-6"
          onClick={onClose}
        >
          Got It!
        </button>
      </div>
    </div>
  );
}