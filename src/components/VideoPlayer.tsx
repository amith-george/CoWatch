// components/VideoPlayer.tsx

'use client';

import { memo, forwardRef, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PlayerState } from '@/hooks/useRoomSocket';

// The ref allows parent components to access the ReactPlayer instance
export interface PlayerRef {
  seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
  getCurrentTime(): number;
  getInternalPlayer(): any;
}

interface VideoPlayerProps {
  url?: string;
  isController: boolean;
  onVideoEnded: () => void;
  isAgeRestricted?: boolean;
  playerState: PlayerState | null;
  onStateChange: (state: PlayerState) => void;
}

// Dynamically import ReactPlayer to avoid issues with server-side rendering
const Player = dynamic(() => import('react-player'), { ssr: false });

const VideoPlayer = forwardRef<PlayerRef, VideoPlayerProps>(
  ({ url, isController, onVideoEnded, isAgeRestricted, playerState, onStateChange }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const playerWrapperRef = useRef<HTMLDivElement>(null);
    const lastPauseRef = useRef<number>(0);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!isController && playerState) {
        setIsPlaying(playerState.status === 1);
        const player = (ref as React.RefObject<PlayerRef>)?.current;
        if (player && typeof player.getCurrentTime === 'function' && playerState.time !== undefined) {
          const currentTime = player.getCurrentTime() || 0;
          const timeDiff = Math.abs(currentTime - playerState.time);
          if (timeDiff > 2) {
            player.seekTo(playerState.time, 'seconds');
          }
        }
      }
    }, [playerState, isController, ref]);

    useEffect(() => {
      const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
      if (url) setIsWaitingForHost(false);
    }, [url]);

    const emitStateUpdate = (status: 1 | 2, source: string) => {
      if (!isController) return;
      const now = Date.now();
      if (debounceRef.current) return;
      if (status === 1 && now - lastPauseRef.current < 1000) return;
      const player = (ref as React.RefObject<PlayerRef>)?.current;
      const timeValue = player?.getCurrentTime?.() ?? 0;
      onStateChange({ time: timeValue, status });
      debounceRef.current = setTimeout(() => { debounceRef.current = null; }, 500);
    };

    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black text-gray-400">
          No video is currently playing.
        </div>
      );
    }

    if (isAgeRestricted) {
      // ✨ Check if the URL is from Twitch for the link text
      const isTwitch = url.includes('twitch.tv');
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4">
          <h2 className="text-xl font-bold mb-2">Video Unavailable</h2>
          <p className="text-center mb-4">This video is age-restricted and cannot be played here.</p>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            {/* ✨ Dynamically set the button text */}
            Watch on {isTwitch ? 'Twitch' : 'YouTube'}
          </Link>
        </div>
      );
    }

    return (
      <div ref={playerWrapperRef} className="relative w-full h-full bg-black overflow-hidden">
        <Player
          ref={ref as any}
          key={url}
          src={url}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls={true}
          onPlay={() => {
            setIsPlaying(true);
            if (isController) emitStateUpdate(1, 'onPlay');
          }}
          onPause={() => {
            setIsPlaying(false);
            if (isController) {
              lastPauseRef.current = Date.now();
              emitStateUpdate(2, 'onPause');
            }
          }}
          onEnded={() => {
            if (isController) {
              onVideoEnded();
            } else {
              setIsWaitingForHost(true);
            }
          }}
          onReady={() => {
            if (!isController && playerState) {
                setIsPlaying(playerState.status === 1);
                const player = (ref as React.RefObject<PlayerRef>)?.current;
                if (player && typeof player.getCurrentTime === 'function' && playerState.time !== undefined) {
                    const currentTime = player.getCurrentTime() || 0;
                    if (Math.abs(currentTime - playerState.time) > 2) {
                        player.seekTo(playerState.time, 'seconds');
                    }
                }
            }
          }}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        {isWaitingForHost && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-75 text-white">
            <p className="text-lg font-semibold">Waiting for the host to play the next video...</p>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
export default memo(VideoPlayer);