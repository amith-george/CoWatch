// src/components/RoomClient.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useRoom } from '@/contexts/RoomContext'; // ✨ 1. Import the new useRoom hook

// Custom Hooks (only those for local UI state remain)
import { useSearch } from '@/hooks/useSearch';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useInvitePrompt } from '@/hooks/useInvitePrompt';

// Components
import Sidebar from '@/components/Sidebar';
import ChatTab from '@/components/ChatTab/ChatTab';
import NameBox from '@/components/NameBox';
import InviteBox from '@/components/InviteBox';
import VideoPlayer from '@/components/VideoPlayer';
import RoomHeader from '@/components/RoomHeader';
import SearchTab from '@/components/SearchTab';

// Note: RequestToast component and types can be removed if they are fully handled in the context
// For now, we'll assume they might still be used here for other potential toasts.

export default function RoomClient() {
  // ✨ 2. Get ALL room data and functions from the context. No more props!
  const {
    loading,
    roomData,
    roomId,
    timeLeft,
    username,
    setUsername,
    members,
    playerRef,
    currentVideoUrl,
    currentVideoMetadata,
    isSharing,
    localStream,
    isViewing,
    screenStream,
    isController,
    isHost,
    stopSharing,
    startSharing,
    requestScreenShare,
    changeVideo,
    addToPlaylist,
    playNextVideo,
    playerState,
    sendPlayerStateChange,
    updateUsername,
  } = useRoom();

  // ✨ 3. All the complex hooks (useRoomData, useRoomSocket, etc.) are GONE from this file.
  //    Only local UI state remains.
  const [showUpdateNameModal, setShowUpdateNameModal] = useState(false);
  const [searchPlatform, setSearchPlatform] = useState<'youtube' | 'twitch'>('youtube');
  const [videoHasEnded, setVideoHasEnded] = useState(false);

  const { isInviteVisible, closeInvitePrompt } = useInvitePrompt(roomId);
  const { results: searchResults, isLoading: isSearchLoading, isPopular, searchQuery, search: searchVideos } = useSearch(searchPlatform);
  useScrollLock();

  const handleVideoEnded = useCallback(() => {
    if (isController) setVideoHasEnded(true);
  }, [isController]);

  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (videoHasEnded) {
      timerId = setTimeout(() => {
        playNextVideo();
        setVideoHasEnded(false);
      }, 10000);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [videoHasEnded, playNextVideo]);

  const handleSelectVideo = (videoUrl: string) => {
    if (isController) {
      changeVideo(videoUrl);
    } else {
      toast.warn('Only the host or moderators can change the video.');
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

  if (loading || !roomData) {
    return (
      <div className="flex bg-[#1f1f1f] min-h-screen text-white items-center justify-center">
        <Sidebar username={username} onProfileClick={() => {}} onScreenShareClick={() => {}} />
        <main className="ml-24 flex-1">
          {/* You can add a more detailed loading skeleton here */}
        </main>
      </div>
    );
  }

  const needsToJoin = !username && !members.find(m => m.userId === roomData.host.userId);
  const showInvite = isController && isInviteVisible;

  return (
    <div className="flex bg-[#1f1f1f] min-h-screen text-white">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
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
            <ChatTab />
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