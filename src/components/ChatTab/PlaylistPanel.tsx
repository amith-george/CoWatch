// src/components/ChatTab/PlaylistPanel.tsx

'use client';

import Image from 'next/image';
import { useState, useEffect, memo, useRef } from 'react';
import { ArrowsRightLeftIcon, EllipsisVerticalIcon, ListBulletIcon, MusicalNoteIcon } from '@heroicons/react/24/solid';
import { useRoom } from '@/contexts/RoomContext';
import { VideoItem } from '@/types/room';

const PlaylistItemSkeleton = () => (
  <div className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
    <div className="w-28 h-16 bg-gray-700 rounded"></div>
    <div className="flex-1 space-y-2">
      <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-700 rounded"></div>
    </div>
  </div>
);

// ✨ Memoized PlaylistItem is now fully self-contained
const PlaylistItem = memo(({ video, index }: { video: VideoItem; index: number; }) => {
  const { isController, movePlaylistItem, removePlaylistItem, playlistVideos } = useRoom();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ✨ This effect correctly handles closing the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };
    if (openMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenu]);

  const videosLength = playlistVideos.length;

  return (
    <li className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-800/50 cursor-pointer">
      <div className="w-28 h-16 relative flex-shrink-0">
        <Image src={video.thumbnailUrl} alt={video.title} fill sizes="112px" style={{ objectFit: 'cover' }} className="rounded"/>
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-white truncate" title={video.title}>{video.title}</p>
        <p className="text-xs text-gray-400 truncate">{video.channelTitle}</p>
      </div>
      {isController && (
        <div ref={menuRef} className="ml-auto relative">
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" onClick={() => setOpenMenu(!openMenu)}/>
          {openMenu && (
            <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded-md shadow-lg py-1 z-10 min-w-[150px]">
              <button
                className={`block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (index > 0) {
                    movePlaylistItem(video.videoUrl, 'up');
                    setOpenMenu(false);
                  }
                }}
                disabled={index === 0}
              >
                Shift Up
              </button>
              <button
                className={`block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left ${index === videosLength - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (index < videosLength - 1) {
                    movePlaylistItem(video.videoUrl, 'down');
                    setOpenMenu(false);
                  }
                }}
                disabled={index === videosLength - 1}
              >
                Shift Down
              </button>
              <button
                className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left"
                onClick={() => {
                  removePlaylistItem(video.videoUrl);
                  setOpenMenu(false);
                }}
              >
                Delete from Playlist
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
});

PlaylistItem.displayName = 'PlaylistItem';

export default function PlaylistsPanel() {
  // ✨ Gets all its data from the context, no more props
  const {
    viewMode,
    setViewMode,
    playlistVideos,
    isPlaylistLoading,
  } = useRoom();

  // ✨ The problematic useEffect that manipulated the DOM is gone

  if (!isPlaylistLoading && playlistVideos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
        <MusicalNoteIcon className="w-12 h-12 mb-2" />
        <p className="font-semibold">Playlist is Empty</p>
        <p className="text-sm">Add videos from the search panel.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-700 flex justify-between items-center px-4 py-3 flex-shrink-0">
        <div className="flex gap-4">
          <ListBulletIcon className={`w-5 h-5 cursor-pointer transition ${viewMode === 'list' ? 'text-blue-500' : 'text-white hover:text-blue-400'}`} onClick={() => setViewMode('list')}/>
          <ArrowsRightLeftIcon className={`w-5 h-5 cursor-pointer transition ${viewMode === 'shuffle' ? 'text-blue-500' : 'text-white hover:text-blue-400'}`} onClick={() => setViewMode('shuffle')}/>
        </div>
        <p className="text-sm font-bold text-white">Up Next</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {isPlaylistLoading ? (
          <div className="space-y-2 px-2">
            <PlaylistItemSkeleton />
            <PlaylistItemSkeleton />
            <PlaylistItemSkeleton />
          </div>
        ) : (
          <ul className="space-y-2 px-2">
            {playlistVideos.map((video, index) => (
              <PlaylistItem
                key={video.videoUrl}
                video={video}
                index={index}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}