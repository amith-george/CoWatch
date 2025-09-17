// hooks/useVideoMetadata.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchVideoMetadata as fetchYouTubeMetadata } from '@/services/youtube.service';
import { fetchTwitchMetadata } from '@/services/twitch.service';
import { VideoItem } from '@/types/room';

// Helper to determine the source of a video URL
const getVideoSource = (url: string): 'youtube' | 'twitch' | 'unknown' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('twitch.tv')) {
    return 'twitch';
  }
  return 'unknown';
};

export function useVideoMetadata(
  videoUrls: string[],
  options: { shouldReverse?: boolean } = {}
) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { shouldReverse = false } = options;

  const getMetadata = useCallback(async (urls: string[]) => {
    setIsLoading(true);

    // 1. Separate URLs by source (YouTube vs. Twitch)
    const youtubeUrls = urls.filter(url => getVideoSource(url) === 'youtube');
    const twitchUrls = urls.filter(url => getVideoSource(url) === 'twitch');

    // 2. Create promises for all metadata fetches
    const promises: Promise<(VideoItem | null)[]>[] = [];

    // Batch fetch YouTube videos
    if (youtubeUrls.length > 0) {
      promises.push(fetchYouTubeMetadata(youtubeUrls));
    }

    // Fetch Twitch videos individually and wrap in a Promise.all
    if (twitchUrls.length > 0) {
      promises.push(Promise.all(twitchUrls.map(fetchTwitchMetadata)));
    }

    // 3. Execute all promises concurrently and combine results
    const results = await Promise.all(promises);
    const combined = results.flat().filter((v): v is VideoItem => v !== null); // Flatten and remove nulls

    // 4. Create a map for original order and set the state
    const metadataMap = new Map(combined.map(v => [v.videoUrl, v]));
    const orderedVideos = urls.map(url => metadataMap.get(url)).filter(Boolean) as VideoItem[];

    setVideos(shouldReverse ? orderedVideos.reverse() : orderedVideos);
    setIsLoading(false);
  }, [shouldReverse]);


  useEffect(() => {
    if (!videoUrls || videoUrls.length === 0) {
      setVideos([]);
      return;
    }
    getMetadata(videoUrls);
  }, [videoUrls, getMetadata]);

  return { videos, isLoading };
}