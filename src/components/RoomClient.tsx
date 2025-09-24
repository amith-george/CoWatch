// src/components/RoomClient.tsx

'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';

// Custom Hooks
import { useRoomSocket, PlayerState, ScreenShareRequest } from '@/hooks/useRoomSocket';
import { useRoomData } from '@/hooks/useRoomData';
import { useCountdown } from '@/hooks/useCountdown';
import { useSearch } from '@/hooks/useSearch';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useInvitePrompt } from '@/hooks/useInvitePrompt';
import { useVideoMetadata } from '@/hooks/useVideoMetadata';
import { useScreenShare } from '@/hooks/useScreenShare';

// Components
import Sidebar from '@/components/Sidebar';
import ChatTab from '@/components/ChatTab/ChatTab';
import NameBox from '@/components/NameBox';
import InviteBox from '@/components/InviteBox';
import VideoPlayer, { type PlayerRef } from '@/components/VideoPlayer';
import RoomHeader from '@/components/RoomHeader';
import SearchTab from '@/components/SearchTab';

// Types
import { VideoItem } from '@/types/room';

// Define the type for our search platform
export type SearchPlatform = 'youtube' | 'twitch';

// Custom component for the screen share request toast
const RequestToast = ({ request, onAccept, onDecline }: {
  request: ScreenShareRequest;
  onAccept: () => void;
  onDecline: () => void;
}) => (
  <div>
    <p className="font-semibold">{request.requesterUsername} wants to screen share.</p>
    <div className="flex justify-end gap-2 mt-3">
      <button
        onClick={onDecline}
        className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
      >
        Decline
      </button>
      <button
        onClick={onAccept}
        className="px-3 py-1 text-sm font-medium text-black bg-green-500 rounded-md hover:bg-green-600"
      >
        Accept
      </button>
    </div>
  </div>
);


export default function RoomClient({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'playlists' | 'history' | 'members'>('chat');
  const [videoHasEnded, setVideoHasEnded] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'shuffle'>('list');
  const [showUpdateNameModal, setShowUpdateNameModal] = useState(false);

  const [searchPlatform, setSearchPlatform] = useState<SearchPlatform>('youtube');

  const playerRef = useRef<PlayerRef | null>(null);

  const { roomData, userId, loading, error } = useRoomData(roomId);
  const initialHistory = useMemo(() => roomData?.history || [], [roomData]);
  const initialVideoUrl = useMemo(() => roomData?.videoUrl || '', [roomData]);
  const initialPlaylist = useMemo(() => roomData?.queue || [], [roomData]);

  const getPlayerState = useCallback((): PlayerState | null => {
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer() as {
        getPlayerState?: () => number;
      };

    if (internalPlayer?.getPlayerState) {
      const rawState = internalPlayer.getPlayerState();
      return {
        time: playerRef.current.getCurrentTime(),
        status: rawState as PlayerState['status'],
      };
    }}
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


  const isController = useMemo(() => {
    if (!userId || !members.length) return false;
    const host = members.find(m => m.role === 'Host');
    if (host) return userId === host.userId;
    const self = members.find(m => m.userId === userId);
    return self?.role === 'Moderator';
  }, [userId, members]);

  const isHost = useMemo(() => {
    if (!userId || !members.length) return false;
    const self = members.find(m => m.userId === userId);
    return self?.role === 'Host';
  }, [userId, members]);


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


  const handleVideoEnded = useCallback(() => {
    if (isController) setVideoHasEnded(true);
  }, [isController]);

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (videoHasEnded && playlist.length > 0) {
      timerId = setTimeout(() => {
        playNextVideo();
        setVideoHasEnded(false);
      }, 10000);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [videoHasEnded, playlist, playNextVideo]);

  const timeLeft = useCountdown(roomData?.expiresAt, () => {
    alert('Room expired. Redirecting...');
    router.push('/');
  });

  const { results: searchResults, isLoading: isSearchLoading, isPopular, searchQuery, search: searchVideos } = useSearch(searchPlatform);
  
  const { videos: historyVideos, isLoading: isHistoryLoading } = useVideoMetadata(history, { shouldReverse: true });
  const { videos: playlistVideos, isLoading: isPlaylistLoading } = useVideoMetadata(playlist);
  const { isInviteVisible, closeInvitePrompt } = useInvitePrompt(roomId);
  useScrollLock();

  const currentVideoMetadata = useMemo(() => {
    if (!currentVideoUrl) return null;
    const allVideos: VideoItem[] = [...searchResults, ...historyVideos, ...playlistVideos];
    const videoMap = new Map(allVideos.map(video => [video.videoUrl, video]));
    return videoMap.get(currentVideoUrl) || null;
  }, [currentVideoUrl, searchResults, historyVideos, playlistVideos]);

  useEffect(() => {
    if (!loading && (error || !roomData)) router.push('/');
  }, [loading, error, roomData, router]);

  useEffect(() => {
    if (!username && roomData && userId) {
      const initialMembers = [roomData.host, ...roomData.moderators, ...roomData.participants];
      const member = initialMembers.find((m) => m && m.userId === userId);
      if (member) setUsername(member.username);
    }
  }, [username, roomData, userId]);

  useEffect(() => {
    if (userId && members.length) {
      const member = members.find((m) => m.userId === userId);
      if (member && member.username !== username) {
        setUsername(member.username);
      }
    }
  }, [members, userId, username]);

  const handleSelectVideo = (videoUrl: string) => {
    if (isController) {
      changeVideo(videoUrl);
    } else {
      alert('Only the host or a moderator can change the video.');
    }
  };

  const handleUpdateUsername = (newName: string) => {
    if (newName !== username) {
      updateUsername(newName);
    }
    setShowUpdateNameModal(false);
  };

  const handleScreenShareClick = () => {
    if (isHost || isSharing) {
      // FIX: Replaced the ternary operator with an if/else statement
      // to resolve the 'no-unused-expressions' warning.
      if (isSharing) {
        stopSharing();
      } else {
        startSharing();
      }
    } else {
      requestScreenShare();
      toast.info('Screen share request sent to the host.');
    }
  };


  if (loading) {
    return (
      <div className="flex bg-[#1f1f1f] min-h-screen text-white items-center justify-center">
        <Sidebar username={username} onProfileClick={() => setShowUpdateNameModal(true)} onScreenShareClick={handleScreenShareClick} />
        <main className="ml-24 flex-1"></main>
      </div>
    );
  }

  if (error || !roomData) return null;

  const needsToJoin = !username && !members.find(m => m.userId === userId);
  const showInvite = isController && isInviteVisible;

  return (
    <div className="flex bg-[#1f1f1f] min-h-screen text-white">
      <ToastContainer
        position="bottom-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Sidebar username={username} onProfileClick={() => setShowUpdateNameModal(true)} onScreenShareClick={handleScreenShareClick} />
      <main className="ml-24 flex-1 pt-2 px-6 pb-6 flex flex-col">
        <RoomHeader
          roomData={roomData}
          timeLeft={timeLeft}
          roomId={roomId}
          onSearch={searchVideos}
          searchPlatform={searchPlatform}
          setSearchPlatform={setSearchPlatform}
        />
        <div className="flex gap-6 items-start">
          <div className="flex-1 flex flex-col gap-4 min-w-0 max-w-[70%]">
            <div className="w-full bg-black rounded-lg border border-gray-700 aspect-[16/9] min-h-[400px]">
              <VideoPlayer
                ref={playerRef}
                url={currentVideoUrl}
                stream={isSharing ? localStream : (isViewing ? screenStream : null)}
                isSharing={isSharing}
                onStopSharing={stopSharing}
                isController={isController}
                onVideoEnded={handleVideoEnded}
                isAgeRestricted={currentVideoMetadata?.isAgeRestricted}
                playerState={playerState}
                onStateChange={sendPlayerStateChange}
              />
            </div>
            <div className="w-full rounded-lg border border-gray-700 bg-gray-800/50 min-h-[75vh]">
              <SearchTab
                results={searchResults}
                isLoading={isSearchLoading}
                isPopular={isPopular}
                onSelectVideo={handleSelectVideo}
                onAddToPlaylist={addToPlaylist}
                searchQuery={searchQuery}
              />
            </div>
          </div>
          <div className="w-[30%] flex-shrink-0 sticky top-6 h-[calc(100vh-7rem)]">
            <ChatTab
              viewMode={viewMode}
              setViewMode={setViewMode}
              {...{
                activeTab,
                setActiveTab,
                currentUserId: userId!,
                messages,
                members,
                sendChatMessage,
                makeModerator,
                removeModerator,
                kickUser,
                banUser,
                historyVideos,
                isHistoryLoading,
                playlistVideos,
                isPlaylistLoading,
                removePlaylistItem,
                movePlaylistItem,
                isController,
              }}
            />
          </div>
        </div>
        
        {(needsToJoin || showInvite || showUpdateNameModal) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
            {needsToJoin && (
              <NameBox
                mode="join"
                onConfirm={(name) => setUsername(name)}
                roomId={roomId}
              />
            )}
            {showInvite && (
              <InviteBox roomUrl={`${window.location.origin}/room/${roomId}`} onClose={closeInvitePrompt} />
            )}
            {showUpdateNameModal && !needsToJoin && (
              <NameBox
                mode="update"
                onConfirm={handleUpdateUsername}
                roomId={roomId}
                currentUsername={username}
                onClose={() => setShowUpdateNameModal(false)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}