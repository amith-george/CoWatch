// src/components/ChatTab/PlaylistPanel.tsx

'use client';

import Image from 'next/image';
import { VideoItem } from '@/types/room';
import { ArrowsRightLeftIcon, ListBulletIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';

interface PlaylistsPanelProps {
  viewMode: 'list' | 'shuffle';
  setViewMode: (mode: 'list' | 'shuffle') => void;
  videos?: VideoItem[];
  isLoading?: boolean;
}

const PlaylistItemSkeleton = () => (
  <div className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
    <div className="w-28 h-16 bg-gray-700 rounded"></div>
    <div className="flex-1 space-y-2">
      <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-700 rounded"></div>
    </div>
  </div>
);

export default function PlaylistsPanel({ 
  viewMode, 
  setViewMode, 
  videos = [], 
  isLoading = false 
}: PlaylistsPanelProps) {

  // --- FIX: Use an "early return" for the empty state ---
  // If the list is empty and not loading, we render a simple, full-height centered message.
  if (!isLoading && videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
        <MusicalNoteIcon className="w-12 h-12 mb-2" />
        <p className="font-semibold">Playlist is Empty</p>
        <p className="text-sm">Add videos from the search panel.</p>
      </div>
    );
  }

  // --- If the list is NOT empty (or is loading), render the full panel with header and list ---
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-700 flex justify-between items-center px-4 py-3 flex-shrink-0">
        <div className="flex gap-4">
          <ListBulletIcon
            className={`w-5 h-5 cursor-pointer transition ${
              viewMode === 'list' ? 'text-blue-500' : 'text-white hover:text-blue-400'
            }`}
            onClick={() => setViewMode('list')}
          />
          <ArrowsRightLeftIcon
            className={`w-5 h-5 cursor-pointer transition ${
              viewMode === 'shuffle' ? 'text-blue-500' : 'text-white hover:text-blue-400'
            }`}
            onClick={() => setViewMode('shuffle')}
          />
        </div>
        <p className="text-sm font-bold text-white">Up Next</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {isLoading ? (
          <div className="space-y-2 px-2">
            <PlaylistItemSkeleton />
            <PlaylistItemSkeleton />
            <PlaylistItemSkeleton />
          </div>
        ) : (
          <ul className="space-y-2 px-2">
            {videos.map((video) => (
              <li
                key={video.videoId}
                className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-800/50 cursor-pointer"
              >
                <div className="w-28 h-16 relative flex-shrink-0">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    sizes="112px"
                    style={{ objectFit: 'cover' }}
                    className="rounded"
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate" title={video.title}>
                    {video.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {video.channelTitle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}