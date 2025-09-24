// hooks/useSearch.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchPopularVideos, searchVideosByQuery, fetchVideoById } from '@/services/youtube.service';
import { searchTwitchChannels, fetchTwitchMetadata } from '@/services/twitch.service';
import { VideoItem, SearchPlatform } from '@/types/room';

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

  useEffect(() => {
    const loadPopular = async () => {
      setIsLoading(true);
      setResults(await fetchPopularVideos());
      setIsLoading(false);
    };
    loadPopular();
  }, []);

  const search = useCallback(
    async (query: string) => {
      setIsLoading(true);
      setSearchQuery(query);

      if (!query.trim()) {
        setIsPopular(true);
        setResults(await fetchPopularVideos());
        setIsLoading(false);
        return;
      }
      
      setIsPopular(false);
      const urlType = getUrlType(query);

      if (urlType === 'youtube') {
        const videoId = extractVideoId(query);
        const video = videoId ? await fetchVideoById(videoId) : null;
        setResults(video ? [video] : []);
      } else if (urlType === 'twitch') {
        const video = await fetchTwitchMetadata(query);
        setResults(video ? [video] : []);
      } else {
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