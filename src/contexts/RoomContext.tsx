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

export interface RoomContextType {
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
  viewMode: 'list' | 'shuffle';
  setViewMode: (mode: 'list' | 'shuffle') => void;
  makeModerator: (userId: string) => void;
  removeModerator: (userId: string) => void;
  kickUser: (userId: string) => void;
  banUser: (userId: string) => void;
  updateUsername: (newName: string) => void;
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

export interface VideoContextType {
  playerRef: React.RefObject<PlayerRef | null>;
  currentVideoUrl: string;
  currentVideoMetadata: VideoItem | null;
  playlistVideos: VideoItem[];
  historyVideos: VideoItem[];
  isPlaylistLoading: boolean;
  isHistoryLoading: boolean;
  playerState: PlayerState | null;
  playNextVideo: () => void;
  changeVideo: (url: string) => void;
  addToPlaylist: (url: string) => void;
  removePlaylistItem: (url: string) => void;
  movePlaylistItem: (url: string, direction: 'up' | 'down') => void;
  sendPlayerStateChange: (state: PlayerState) => void;
}

export interface ChatContextType {
  messages: ChatMessage[];
  sendChatMessage: (
    text: string, 
    replyTo?: { messageId: string; senderName: string; content: string }
  ) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);
const VideoContext = createContext<VideoContextType | undefined>(undefined);
const ChatContext = createContext<ChatContextType | undefined>(undefined);

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
    sendChatMessage,
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

  const currentVideoMetadata = useMemo(() => {
    if (!currentVideoUrl) return null;
    return playlistVideos.find(v => v.videoUrl === currentVideoUrl) || 
           historyVideos.find(v => v.videoUrl === currentVideoUrl) || 
           null;
  }, [currentVideoUrl, playlistVideos, historyVideos]);

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

  const roomValue = useMemo<RoomContextType>(() => ({
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
    viewMode,
    setViewMode,
    makeModerator,
    removeModerator,
    kickUser,
    banUser,
    updateUsername,
    isSharing,
    isViewing,
    localStream,
    screenStream,
    startSharing,
    stopSharing,
    requestScreenShare,
    respondToScreenShare,
    screenShareRequest,
  }), [
    roomId, roomData, loading, timeLeft, members, userId, username, setUsername,
    isController, isHost, viewMode, setViewMode, makeModerator, removeModerator,
    kickUser, banUser, updateUsername, isSharing, isViewing, localStream, screenStream,
    startSharing, stopSharing, requestScreenShare, respondToScreenShare, screenShareRequest
  ]);

  const videoValue = useMemo<VideoContextType>(() => ({
    playerRef,
    currentVideoUrl,
    currentVideoMetadata,
    playlistVideos,
    historyVideos,
    isPlaylistLoading,
    isHistoryLoading,
    playerState,
    playNextVideo,
    changeVideo,
    addToPlaylist,
    removePlaylistItem,
    movePlaylistItem,
    sendPlayerStateChange,
  }), [
    playerRef, currentVideoUrl, currentVideoMetadata, playlistVideos, historyVideos,
    isPlaylistLoading, isHistoryLoading, playerState, playNextVideo, changeVideo,
    addToPlaylist, removePlaylistItem, movePlaylistItem, sendPlayerStateChange
  ]);

  const chatValue = useMemo<ChatContextType>(() => ({
    messages,
    sendChatMessage,
  }), [messages, sendChatMessage]);

  return (
    <RoomContext.Provider value={roomValue}>
      <VideoContext.Provider value={videoValue}>
        <ChatContext.Provider value={chatValue}>
          {children}
        </ChatContext.Provider>
      </VideoContext.Provider>
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideo must be used within a RoomProvider');
  }
  return context;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a RoomProvider');
  }
  return context;
}