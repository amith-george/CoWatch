// src/components/ChatTab/HistoryPanel.tsx

'use client';

import Image from 'next/image';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useRoom } from '@/contexts/RoomContext'; 


const HistoryItemSkeleton = () => (
  <div className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
    <div className="w-28 h-16 bg-gray-700 rounded"></div>
    <div className="flex-1 space-y-2">
      <div className="w-3/4 h-4 bg-gray-700 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-700 rounded"></div>
    </div>
  </div>
);

export default function HistoryPanel() {
  const { historyVideos, isHistoryLoading } = useRoom();

  if (isHistoryLoading) {
    return (
      <div className="space-y-2">
        <HistoryItemSkeleton />
        <HistoryItemSkeleton />
        <HistoryItemSkeleton />
      </div>
    );
  }

  if (historyVideos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
        <ClockIcon className="w-12 h-12 mb-2" />
        <p className="font-semibold">No Video History</p>
        <p className="text-sm">Videos you watch will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {historyVideos.map((video, index) => (
        <li
          key={`${video.videoId}-${index}`}
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
  );
}