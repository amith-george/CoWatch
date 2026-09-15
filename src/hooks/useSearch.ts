// hooks/useSearch.ts

import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadPopular = async () => {
      setIsLoading(true);
      setResults(await fetchPopularVideos());
      setIsLoading(false);
    };
    loadPopular();
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (!query.trim()) {
          setIsPopular(true);
          setResults(await fetchPopularVideos());
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
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // 1-second debounce
  }, [platform]);

  return { results, isLoading, isPopular, searchQuery, search };
};