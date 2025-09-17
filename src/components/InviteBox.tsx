'use client';

import { useState } from 'react';

export default function InviteBox({
  roomUrl,
  onClose,
}: {
  roomUrl: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2s
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.50)' }}
    >
      <div className="bg-[#1f1f1f] text-white p-10 rounded-lg shadow-2xl w-[95%] max-w-3xl pointer-events-auto">
        <h2 className="text-2xl font-bold mb-2">
          Invite friends to watch with you!
        </h2>

        {/* Optional description about the site */}
        <p className="text-sm text-gray-400 mb-4">
          CoWatch lets you and your friends watch YouTube or Twitch together in sync — no accounts, no installs. Just share this link and enjoy together.
        </p>

        <hr className="border-gray-600 my-4" />

        <label className="block text-sm font-bold mb-2">
          Copy and share this link:
        </label>

        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            readOnly
            value={roomUrl}
            className="flex-1 bg-[#2c2c2c] text-white border border-gray-600 rounded-l-md px-4 py-3 focus:outline-none cursor-default"
          />
          <button
            onClick={handleCopy}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-3 rounded-r-md transition text-sm"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <hr className="border-gray-600 my-6" />

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black font-semibold px-4 py-2 rounded-md text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
