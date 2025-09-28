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

type ReactPlayerModule = typeof import('react-player');
type ReactPlayerComponent = ReactPlayerModule['default'];
type ReactPlayerInstance = ElementRef<ReactPlayerComponent>;
type ReactPlayerProps = ComponentProps<ReactPlayerComponent>;

export interface PlayerRef {
  seekTo(amount: number, type?: 'seconds' | 'fraction'): void;
  getCurrentTime(): number;
  getInternalPlayer(): unknown;
}

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
    const [isDebouncing, setIsDebouncing] = useState(false);
    const playerWrapperRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

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

    const emitStateUpdate = (status: 1 | 2) => {
      if (!isController || isDebouncing) return;

      setIsDebouncing(true);

      const player = (ref as React.RefObject<PlayerRef>)?.current;
      const timeValue = player?.getCurrentTime?.() ?? 0;
      onStateChange({ time: timeValue, status });

      setTimeout(() => {
        setIsDebouncing(false);
      }, 500);
    };
    
    if (stream) {
      return (
        <div className="relative w-full h-full bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full" />
          {isSharing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={onStopSharing}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Stop Sharing
              </button>
            </div>
          )}
        </div>
      );
    }

    if (!url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <p className="text-gray-400">Search for a video below to get started!</p>
        </div>
      );
    }
    
    if (isAgeRestricted) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4">
          <h3 className="text-xl font-bold text-red-500 mb-2">Age-Restricted Content</h3>
          <p className="text-center mb-4">This video is age-restricted and cannot be played here. Please watch it on the original platform.</p>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
          >
            Watch on YouTube
          </Link>
        </div>
      );
    }

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
            if (isController) emitStateUpdate(1);
          }}
          onPause={() => {
            setIsPlaying(false);
            if (isController) emitStateUpdate(2);
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
        
        {isDebouncing && (
          <div className="absolute inset-0 z-10 cursor-wait" />
        )}

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