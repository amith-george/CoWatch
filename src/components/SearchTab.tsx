// src/components/SearchTab.tsx

'use client';

import Image from 'next/image';
import { PlayIcon, PlusIcon, FireIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { VideoItem } from '@/types/room';

// FIX: Removed 'searchPlatform' from the props interface
interface SearchTabProps {
  results: VideoItem[];
  isLoading: boolean;
  isPopular: boolean;
  onSelectVideo: (videoUrl: string) => void;
  onAddToPlaylist: (videoUrl: string) => void;
  searchQuery?: string;
}

const VideoCard = ({ video, onSelectVideo, onAddToPlaylist, isPriority }: { video: VideoItem; onSelectVideo: (url: string) => void; onAddToPlaylist: (url: string) => void; isPriority: boolean; }) => {
  const handlePlay = (e: React.MouseEvent) => { e.stopPropagation(); onSelectVideo(video.videoUrl); };
  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); onAddToPlaylist(video.videoUrl); };

  const maxTitleLength = 90;
  const truncatedTitle = video.title.length > maxTitleLength
    ? video.title.slice(0, video.title.lastIndexOf(' ', maxTitleLength)) + '...'
    : video.title;

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-150 group cursor-pointer">
      <div className="relative w-32 h-18 flex-shrink-0">
        <Image src={video.thumbnailUrl} alt={video.title} fill sizes="128px" style={{ objectFit: 'cover' }} className="rounded-md shadow-md" priority={isPriority} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent rounded-md"></div>
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-sm font-semibold text-white truncate" title={video.title}>{truncatedTitle}</p>
        <p className="text-xs text-gray-400 truncate">{video.channelTitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-2 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
        <button onClick={handleAdd} className="p-2 rounded-full bg-gray-600 text-white hover:bg-gray-500" title="Add to playlist"><PlusIcon className="w-5 h-5" /></button>
        <button onClick={handlePlay} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500" title="Play this video"><PlayIcon className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

const VideoCardSkeleton = () => (
  <div className="flex items-center gap-4 p-2 rounded-lg animate-pulse">
    <div className="w-32 h-18 bg-gray-700 rounded-md flex-shrink-0"></div>
    <div className="flex-grow min-w-0 space-y-2">
      <div className="w-5/6 h-4 bg-gray-700 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-700 rounded"></div>
    </div>
  </div>
);

// FIX: Removed 'searchPlatform' from the destructured props
export default function SearchTab({ results, isLoading, isPopular, onSelectVideo, onAddToPlaylist, searchQuery }: SearchTabProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full bg-transparent p-4 flex flex-col">
        <div className="flex items-center gap-2 text-lg font-bold text-white mb-4 shrink-0 animate-pulse">
          <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
          <div className="w-48 h-6 bg-gray-600 rounded"></div>
        </div>
        <div className="space-y-3 pr-2">
          {[...Array(4)].map((_, i) => <VideoCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (results.length === 0 && !isPopular) {
    return (
      <div className="w-full h-full bg-transparent p-4 flex flex-col items-center justify-center">
        <MagnifyingGlassIcon className="w-12 h-12 text-gray-500 mb-2" />
        <p className="text-gray-400 text-center">No results found for &ldquo;{searchQuery}&rdquo;.</p>
      </div>
    );
  }

  const headerText = isPopular ? 'Popular on YouTube' : searchQuery ? `Results for "${searchQuery}"` : 'Search Results';

  return (
    <div className="w-full h-full bg-transparent p-4 flex flex-col">
      <div className="flex items-center gap-2 text-lg font-bold text-white mb-4 shrink-0 min-w-0">
        {isPopular ? (
          <FireIcon className="w-6 h-6 text-orange-400 flex-shrink-0" />
        ) : (
          <MagnifyingGlassIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
        )}
        <h3 className="truncate" title={headerText}>
          {isPopular ? (
            'Popular on YouTube'
          ) : searchQuery ? (
            <>Results for &ldquo;{searchQuery}&rdquo;</>
          ) : (
            'Search Results'
          )}
        </h3>
        {!isPopular && results.length > 0 && (
          <span className="text-sm font-normal text-gray-400 ml-2 flex-shrink-0">
            ({results.length} result{results.length !== 1 ? 's' : ''})
          </span>
        )}
      </div>
      <div className="search-results-container space-y-3 overflow-y-auto flex-grow pr-2 max-w-full">
        {results.map((video, index) => (
          <VideoCard
            key={video.videoUrl}
            video={video}
            onSelectVideo={onSelectVideo}
            onAddToPlaylist={onAddToPlaylist}
            isPriority={index < 2}
          />
        ))}
      </div>
    </div>
  );
}