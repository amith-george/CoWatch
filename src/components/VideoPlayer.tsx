// src/components/VideoPlayer.tsx

'use client';

import {
  memo,
  forwardRef,
  useEffect,
  useState,
  useRef,
  ComponentProps,
  ElementRef,
} from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PlayerState } from '@/hooks/useRoomSocket';

// --- Types for react-player ---
type ReactPlayerModule = typeof import('react-player');
type ReactPlayerComponent = ReactPlayerModule['default'];
type ReactPlayerInstance = ElementRef<ReactPlayerComponent>;
type ReactPlayerProps = ComponentProps<ReactPlayerComponent>;

// The ref allows parent components to access the ReactPlayer instance
export interface PlayerRef {
  seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
  getCurrentTime(): number;
  getInternalPlayer(): unknown;
}

// Props for VideoPlayer
interface VideoPlayerProps {
  url?: string;
  stream?: MediaStream | null;
  isSharing?: boolean;
  onStopSharing?: () => void;
  isController: boolean;
  onVideoEnded: () => void;
  isAgeRestricted?: boolean;
  playerState: PlayerState | null;
  onStateChange: (state: PlayerState) => void;
}

// Dynamically import ReactPlayer to avoid SSR issues
const Player = dynamic(() => import('react-player'), { ssr: false }) as unknown as React.ComponentType<
  ReactPlayerProps & { ref?: React.Ref<ReactPlayerInstance> }
>;

const VideoPlayer = forwardRef<PlayerRef, VideoPlayerProps>(
  (
    {
      url,
      stream,
      isSharing,
      onStopSharing,
      isController,
      onVideoEnded,
      isAgeRestricted,
      playerState,
      onStateChange,
    },
    ref
  ) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const playerWrapperRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastPauseRef = useRef<number>(0);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Attach incoming stream to <video> element
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    // Sync playback when not controller
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
      if (url) setIsWaitingForHost(false);
    }, [url]);

    // FIX: Removed the unused 'source' parameter from the function definition.
    const emitStateUpdate = (status: 1 | 2) => {
      if (!isController) return;
      const now = Date.now();
      if (debounceRef.current) return;
      if (status === 1 && now - lastPauseRef.current < 1000) return;
      const player = (ref as React.RefObject<PlayerRef>)?.current;
      const timeValue = player?.getCurrentTime?.() ?? 0;
      onStateChange({ time: timeValue, status });
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
      }, 500);
    };

    // If a stream is active, render the native video player
    if (stream) {
      return (
        <div ref={playerWrapperRef} className="relative w-full h-full bg-black group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls
            className="w-full h-full object-contain"
          />
          {isSharing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={onStopSharing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Stop Sharing
              </button>
            </div>
          )}
        </div>
      );
    }

    // If no URL
    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black text-gray-400">
          No video is currently playing.
        </div>
      );
    }

    // Age restriction
    if (isAgeRestricted) {
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
            Watch on {isTwitch ? 'Twitch' : 'YouTube'}
          </Link>
        </div>
      );
    }

    // ReactPlayer fallback
    return (
      <div ref={playerWrapperRef} className="relative w-full h-full bg-black overflow-hidden">
        <Player
          ref={ref as React.Ref<ReactPlayerInstance>}
          key={url}
          src={url}
          width="100%"
          height="100%"
          playing={isPlaying}
          controls
          onPlay={() => {
            setIsPlaying(true);
            // FIX: Removed the unused 'source' argument from the function call.
            if (isController) emitStateUpdate(1);
          }}
          onPause={() => {
            setIsPlaying(false);
            if (isController) {
              lastPauseRef.current = Date.now();
              // FIX: Removed the unused 'source' argument from the function call.
              emitStateUpdate(2);
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