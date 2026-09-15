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

// Module-level cache to prevent redownloading metadata for known videos
const globalMetadataCache = new Map<string, VideoItem>();

export function useVideoMetadata(
  videoUrls: string[],
  options: { shouldReverse?: boolean } = {}
) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { shouldReverse = false } = options;

  const getMetadata = useCallback(async (urls: string[]) => {
    // 1. Deduplicate incoming URLs and identify what's missing from the cache
    const uniqueUrls = Array.from(new Set(urls));
    const missingUrls = uniqueUrls.filter(url => !globalMetadataCache.has(url));

    // 2. Fetch missing metadata if any
    if (missingUrls.length > 0) {
      setIsLoading(true);
      const youtubeUrls = missingUrls.filter(url => getVideoSource(url) === 'youtube');
      const twitchUrls = missingUrls.filter(url => getVideoSource(url) === 'twitch');

      const promises: Promise<(VideoItem | null)[]>[] = [];

      if (youtubeUrls.length > 0) {
        promises.push(fetchYouTubeMetadata(youtubeUrls));
      }
      if (twitchUrls.length > 0) {
        promises.push(Promise.all(twitchUrls.map(fetchTwitchMetadata)));
      }

      const results = await Promise.all(promises);
      const combined = results.flat().filter((v): v is VideoItem => v !== null);

      // 3. Save fetched metadata to global cache
      combined.forEach(video => {
        globalMetadataCache.set(video.videoUrl, video);
      });
    }

    // 4. Resolve all requested URLs from the cache to preserve order (and duplicates)
    const orderedVideos = urls.map(url => globalMetadataCache.get(url)).filter(Boolean) as VideoItem[];

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