// hooks/useSearch.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchPopularVideos, searchVideosByQuery, fetchVideoById } from '@/services/youtube.service';
import { searchTwitchChannels, fetchTwitchMetadata } from '@/services/twitch.service';
import { VideoItem } from '@/types/room';
import type { SearchPlatform } from '@/components/RoomClient';

const getUrlType = (url: string): 'youtube' | 'twitch' | 'unknown' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('twitch.tv')) return 'twitch';
  return 'unknown';
};

const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const useSearch = (platform: SearchPlatform) => {
  const [results, setResults] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopular, setIsPopular] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ✨ UPDATED: This useEffect no longer depends on the `platform`.
  // It will only run once when the component mounts to load popular YouTube videos.
  useEffect(() => {
    const loadPopular = async () => {
      setIsLoading(true);
      setResults(await fetchPopularVideos());
      setIsLoading(false);
    };
    loadPopular();
  }, []); // Dependency array is now empty

  const search = useCallback(
    async (query: string) => {
      setIsLoading(true);
      setSearchQuery(query);

      // ✨ UPDATED: If the search query is cleared, always show popular YouTube videos.
      if (!query.trim()) {
        setIsPopular(true);
        setResults(await fetchPopularVideos());
        setIsLoading(false);
        return;
      }
      
      setIsPopular(false);
      const urlType = getUrlType(query);

      // Pasted URL logic remains the same
      if (urlType === 'youtube') {
        const videoId = extractVideoId(query);
        const video = videoId ? await fetchVideoById(videoId) : null;
        setResults(video ? [video] : []);
      } else if (urlType === 'twitch') {
        const video = await fetchTwitchMetadata(query);
        setResults(video ? [video] : []);
      } else {
        // Active search logic correctly uses the platform
        const searchResults =
          platform === 'youtube'
            ? await searchVideosByQuery(query)
            : await searchTwitchChannels(query);
        setResults(searchResults);
      }

      setIsLoading(false);
    },
    [platform]
  );

  return { results, isLoading, isPopular, searchQuery, search };
};