// src/contexts/RoomContext.tsx

'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useRoomData } from '@/hooks/useRoomData';
import { useRoomSocket, PlayerState, ScreenShareRequest } from '@/hooks/useRoomSocket';
import { useScreenShare } from '@/hooks/useScreenShare';
import { useCountdown } from '@/hooks/useCountdown';
import { useVideoMetadata } from '@/hooks/useVideoMetadata';
import { Room, Member, ChatMessage, VideoItem } from '@/types/room';
import { PlayerRef } from '@/components/VideoPlayer';

const RequestToast = ({ request, onAccept, onDecline }: {
  request: ScreenShareRequest;
  onAccept: () => void;
  onDecline: () => void;
}) => (
  <div>
    <p className="font-semibold">{request.requesterUsername} wants to screen share.</p>
    <div className="flex justify-end gap-2 mt-3">
      <button onClick={onDecline} className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
        Decline
      </button>
      <button onClick={onAccept} className="px-3 py-1 text-sm font-medium text-black bg-green-500 rounded-md hover:bg-green-600">
        Accept
      </button>
    </div>
  </div>
);

interface RoomContextType {
  roomId: string;
  roomData: Room | null;
  loading: boolean;
  timeLeft: number;
  members: Member[];
  currentUserId: string | null;
  username: string | null;
  setUsername: (name: string | null) => void;
  isController: boolean;
  isHost: boolean;
  playerRef: React.RefObject<PlayerRef>;
  currentVideoUrl: string;
  currentVideoMetadata: VideoItem | null;
  playlistVideos: VideoItem[];
  historyVideos: VideoItem[];
  isPlaylistLoading: boolean;
  isHistoryLoading: boolean;
  viewMode: 'list' | 'shuffle';
  setViewMode: (mode: 'list' | 'shuffle') => void;
  messages: ChatMessage[];
  playerState: PlayerState | null;

  // --- UPDATED sendChatMessage signature ---
  sendChatMessage: (
    text: string, 
    replyTo?: { messageId: string; senderName: string; content: string }
  ) => void;
  
  playNextVideo: () => void;
  changeVideo: (url: string) => void;
  addToPlaylist: (url: string) => void;
  removePlaylistItem: (url: string) => void;
  movePlaylistItem: (url: string, direction: 'up' | 'down') => void;
  makeModerator: (userId: string) => void;
  removeModerator: (userId: string) => void;
  kickUser: (userId: string) => void;
  banUser: (userId: string) => void;
  updateUsername: (newName: string) => void;
  sendPlayerStateChange: (state: PlayerState) => void;
  isSharing: boolean;
  isViewing: boolean;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  startSharing: () => void;
  stopSharing: () => void;
  requestScreenShare: () => void;
  respondToScreenShare: (requesterId: string, accepted: boolean) => void;
  screenShareRequest: ScreenShareRequest | null;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({ children, roomId }: { children: ReactNode; roomId: string }) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'shuffle'>('list');
  const playerRef = useRef<PlayerRef | null>(null);

  const { roomData, userId, loading, error } = useRoomData(roomId);
  
  const initialHistory = useMemo(() => roomData?.history || [], [roomData]);
  const initialVideoUrl = useMemo(() => roomData?.videoUrl || '', [roomData]);
  const initialPlaylist = useMemo(() => roomData?.queue || [], [roomData]);

  const getPlayerState = useCallback((): PlayerState | null => {
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer() as { getPlayerState?: () => number };
      if (internalPlayer?.getPlayerState) {
        const rawState = internalPlayer.getPlayerState();
        return {
          time: playerRef.current.getCurrentTime(),
          status: rawState as PlayerState['status'],
        };
      }
    }
    return null;
  }, []);

  const {
    messages,
    members,
    history,
    currentVideoUrl,
    playlist,
    playerState,
    sendPlayerStateChange,
    playNextVideo,
    sendChatMessage, // This now has the new signature from your hook
    changeVideo,
    addToPlaylist,
    makeModerator,
    removeModerator,
    kickUser,
    banUser,
    removePlaylistItem,
    movePlaylistItem,
    updateUsername,
    requestScreenShare,
    respondToScreenShare,
    screenShareRequest,
    screenSharePermissionGranted,
    resetScreenSharePermission,
  } = useRoomSocket(roomId, userId, username, initialHistory, initialVideoUrl, initialPlaylist, viewMode, getPlayerState);

  const { isSharing, isViewing, screenStream, localStream, startSharing, stopSharing } = useScreenShare(roomId, members);
  const timeLeft = useCountdown(roomData?.expiresAt, () => {
    alert('Room expired. Redirecting...');
    router.push('/');
  });

  const { videos: historyVideos, isLoading: isHistoryLoading } = useVideoMetadata(history, { shouldReverse: true });
  const { videos: playlistVideos, isLoading: isPlaylistLoading } = useVideoMetadata(playlist);

  const isController = useMemo(() => {
    if (!userId || !members.length) return false;
    const self = members.find(m => m.userId === userId);
    return self?.role === 'Host' || self?.role === 'Moderator';
  }, [userId, members]);

  const isHost = useMemo(() => {
    if (!userId || !members.length) return false;
    const self = members.find(m => m.userId === userId);
    return self?.role === 'Host';
  }, [userId, members]);

  const { videos: searchResults } = useVideoMetadata(playlist);
  const currentVideoMetadata = useMemo(() => {
    if (!currentVideoUrl) return null;
    const allVideos: VideoItem[] = [...searchResults, ...historyVideos, ...playlistVideos];
    const videoMap = new Map(allVideos.map(video => [video.videoUrl, video]));
    return videoMap.get(currentVideoUrl) || null;
  }, [currentVideoUrl, searchResults, historyVideos, playlistVideos]);

  useEffect(() => {
    if (!loading && (error || !roomData)) {
      router.push('/');
    }
  }, [loading, error, roomData, router]);

  useEffect(() => {
    if (!username && roomData && userId) {
      const member = [...members].find(m => m.userId === userId);
      if (member) setUsername(member.username);
    }
  }, [username, roomData, userId, members]);
  
  useEffect(() => {
    if (isHost && screenShareRequest) {
      const handleAccept = () => {
        respondToScreenShare(screenShareRequest.requesterId, true);
        toast.dismiss(`ssr-${screenShareRequest.requesterId}`);
      };
      const handleDecline = () => {
        respondToScreenShare(screenShareRequest.requesterId, false);
        toast.dismiss(`ssr-${screenShareRequest.requesterId}`);
      };
      toast(<RequestToast request={screenShareRequest} onAccept={handleAccept} onDecline={handleDecline} />, {
        toastId: `ssr-${screenShareRequest.requesterId}`,
        autoClose: false,
      });
    }
  }, [screenShareRequest, isHost, respondToScreenShare]);

  useEffect(() => {
    if (screenSharePermissionGranted) {
      startSharing();
      resetScreenSharePermission();
    }
  }, [screenSharePermissionGranted, startSharing, resetScreenSharePermission]);

  const value = {
    roomId,
    roomData,
    loading,
    timeLeft,
    members,
    currentUserId: userId,
    username,
    setUsername,
    isController,
    isHost,
    playerRef,
    currentVideoUrl,
    currentVideoMetadata,
    playlistVideos,
    historyVideos,
    isPlaylistLoading,
    isHistoryLoading,
    viewMode,
    setViewMode,
    messages,
    playerState,
    sendChatMessage,
    playNextVideo,
    changeVideo,
    addToPlaylist,
    removePlaylistItem,
    movePlaylistItem,
    makeModerator,
    removeModerator,
    kickUser,
    banUser,
    updateUsername,
    sendPlayerStateChange,
    isSharing,
    isViewing,
    localStream,
    screenStream,
    startSharing,
    stopSharing,
    requestScreenShare,
    respondToScreenShare,
    screenShareRequest,
  };

  return <RoomContext.Provider value={value as RoomContextType}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}