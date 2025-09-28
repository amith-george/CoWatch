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

// --- Types remain the same ---
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

    // --- Stream, No URL, and Age Restricted sections remain the same ---
    if (stream) { /* ... */ }
    if (!url) { /* ... */ }
    if (isAgeRestricted) { /* ... */ }

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
        
        {/* NEW: Interaction-blocking overlay */}
        {/* This div appears during the debounce period, capturing all clicks and key presses. */}
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