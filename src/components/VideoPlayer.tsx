'use client';

import { memo, forwardRef, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PlayerState } from '@/hooks/useRoomSocket';
// ✨ REMOVED: Unused icon imports
// import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/solid';

// The ref allows parent components to access the ReactPlayer instance
export interface PlayerRef {
  seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
  getCurrentTime(): number;
  getInternalPlayer(): any;
}

// Updated props to accept a stream and sharing controls
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

// Dynamically import ReactPlayer to avoid issues with server-side rendering
const Player = dynamic(() => import('react-player'), { ssr: false });

const VideoPlayer = forwardRef<PlayerRef, VideoPlayerProps>(
  ({ url, stream, isSharing, onStopSharing, isController, onVideoEnded, isAgeRestricted, playerState, onStateChange }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isWaitingForHost, setIsWaitingForHost] = useState(false);
    const playerWrapperRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastPauseRef = useRef<number>(0);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    
    // ✨ REMOVED: The state and effect for tracking fullscreen state are no longer needed.

    // This effect handles attaching the incoming stream to the video element
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

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
    
    // ✨ REMOVED: The handleToggleFullscreen function is no longer needed.

    // If a stream is active, render the native video player for it
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

          {/* ✨ REMOVED: The custom fullscreen button JSX has been deleted. */}

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

    // --- Fallback to ReactPlayer for URLs if no stream is present ---

    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black text-gray-400">
          No video is currently playing.
        </div>
      );
    }

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