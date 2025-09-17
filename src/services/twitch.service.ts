// src/services/twitch.service.ts

import { VideoItem } from '@/types/room';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

/**
 * Fetches metadata for a single Twitch URL from your backend.
 * @param {string} url - The full Twitch URL.
 * @returns {Promise<VideoItem | null>} A promise that resolves to a video item or null on failure.
 */
export const fetchTwitchMetadata = async (url: string): Promise<VideoItem | null> => {
  if (!url) return null;

  try {
    // This calls the GET /api/twitch/metadata endpoint you created
    const response = await fetch(`${API_BASE_URL}/twitch/metadata?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Twitch metadata');
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching Twitch metadata for ${url}:`, error);
    return null; // Return null on failure so Promise.all doesn't break
  }
};


/**
 * ✨ NEW FUNCTION
 * Fetches the list of popular Twitch streams.
 */
export const fetchPopularTwitchStreams = async (): Promise<VideoItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/twitch/popular`);
    if (!response.ok) throw new Error('Failed to fetch popular streams');
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular Twitch streams:', error);
    return [];
  }
};


/**
 * ✨ NEW FUNCTION
 * Searches for Twitch channels based on a query.
 */
export const searchTwitchChannels = async (query: string): Promise<VideoItem[]> => {
  if (!query.trim()) {
    return fetchPopularTwitchStreams();
  }
  try {
    const response = await fetch(`${API_BASE_URL}/twitch/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search Twitch channels');
    return await response.json();
  } catch (error) {
    console.error('Error searching Twitch channels:', error);
    return [];
  }
};