// src/services/youtube.service.ts

import { VideoItem } from '@/types/room';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

/**
 * Fetches the list of popular YouTube videos.
 * @returns {Promise<VideoItem[]>} A promise that resolves to an array of video items.
 */
export const fetchPopularVideos = async (): Promise<VideoItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/youtube/popular`);
    if (!response.ok) {
      throw new Error('Failed to fetch popular videos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular videos:', error);
    return []; // Return an empty array on failure
  }
};



/**
 * Searches for YouTube videos based on a query.
 * @param {string} query - The search term.
 * @returns {Promise<VideoItem[]>} A promise that resolves to an array of video items.
 */
export const searchVideosByQuery = async (query: string): Promise<VideoItem[]> => {
  if (!query.trim()) {
    return fetchPopularVideos();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/youtube/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search videos');
    }
    return await response.json();
  } catch (error) {
    console.error('Error searching videos:', error);
    return []; // Return an empty array on failure
  }
};



/**
 * --- NEW FUNCTION ---
 * Fetches metadata for a list of YouTube video URLs.
 * @param {string[]} urls - An array of YouTube video URLs.
 * @returns {Promise<VideoItem[]>} A promise that resolves to an array of video items with metadata.
 */
export const fetchVideoMetadata = async (urls: string[]): Promise<VideoItem[]> => {
  if (!urls || urls.length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/youtube/metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls }), // Send the URLs in the request body
    });

    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return [];
  }
};


// Get video by ID
export const fetchVideoById = async (videoId: string): Promise<VideoItem | null> => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/youtube/video/${videoId}`);
    if (!res.ok) throw new Error('Failed to fetch video by ID');
    return await res.json();
  } catch (error) {
    console.error('Error in fetchVideoById:', error);
    return null;
  }
};