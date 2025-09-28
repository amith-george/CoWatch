'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '@/utils/socket';
import { ChatMessage, Member } from '@/types/room';
import { toast } from 'react-toastify';

export interface PlayerState {
  time: number;
  status: 0 | 1 | 2 | 3 | -1 | 5;
}

export interface InitialState extends PlayerState {
  videoUrl?: string;
}

export interface ScreenShareRequest {
  requesterId: string;
  requesterUsername: string;
}

export function useRoomSocket(
  roomId: string,
  userId: string | null,
  username: string | null,
  initialHistory: string[],
  initialVideoUrl: string,
  initialPlaylist: string[],
  viewMode: 'list' | 'shuffle',
  getPlayerState: () => PlayerState | null
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [history, setHistory] = useState<string[]>(initialHistory);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(initialVideoUrl);
  const [playlist, setPlaylist] = useState<string[]>(initialPlaylist);
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [screenShareRequest, setScreenShareRequest] = useState<ScreenShareRequest | null>(null);
  const [screenSharePermissionGranted, setScreenSharePermissionGranted] = useState(false);
  const hasJoined = useRef(false);

  useEffect(() => {
    setHistory(initialHistory);
    setCurrentVideoUrl(initialVideoUrl);
    setPlaylist(initialPlaylist);
  }, [initialHistory, initialVideoUrl, initialPlaylist]);

  useEffect(() => {
    const fetchStoredMessages = async () => {
      if (!roomId) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/messages/${roomId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        
        const storedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
          ...msg,
          type: 'user', // Add the client-side type property
        }));

        setMessages(storedMessages);
      } catch (err) {
        console.error('Error loading stored messages:', err);
      }
    };

    fetchStoredMessages();
  }, [roomId]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log('Socket re-connected:', socket.id);
      if (roomId && userId && username) {
        socket.emit('joinRoom', { roomId, userId, username });
        socket.emit('requestInitialState', { roomId });
        hasJoined.current = true;
      }
    };

    socket.on('connect', handleConnect);

    if (socket.connected && roomId && userId && username && !hasJoined.current) {
      console.log('Username available, joining room...');
      socket.emit('joinRoom', { roomId, userId, username });
      socket.emit('requestInitialState', { roomId });
      hasJoined.current = true;
    }

    const handleSyncState = (state: InitialState) => {
      console.log('%cVIEWER: Received syncPlayerState:', 'color: green; font-weight: bold;', state);
      setPlayerState({ time: state.time, status: state.status });
      if (state.videoUrl) {
        setCurrentVideoUrl(state.videoUrl);
      }
    };

    const handleGetControllerState = ({ requesterId }: { requesterId: string }) => {
      const currentState = getPlayerState();
      if (currentState) {
        socket.emit('controllerState', { requesterId, state: currentState });
      }
    };

    socket.on('syncPlayerState', handleSyncState);
    socket.on('initialState', handleSyncState);
    socket.on('getControllerState', handleGetControllerState);

    socket.on('membersUpdate', (data) => setMembers(data.members));
    
    socket.on('chatMessage', (newMessage: ChatMessage) => {
      setMessages((prev) => [...prev, { ...newMessage, type: 'user' }]);
    });

    const handleHistoryUpdate = ({ history: newHistory }: { history: string[] }) => setHistory(newHistory);
    socket.on('historyUpdate', handleHistoryUpdate);

    const handleVideoUpdate = ({ videoUrl }: { videoUrl: string }) => {
      setCurrentVideoUrl((currentUrl) => (currentUrl !== videoUrl ? videoUrl : currentUrl));
    };
    socket.on('videoUpdate', handleVideoUpdate);

    const handlePlaylistUpdate = ({ playlist: newPlaylist }: { playlist: string[] }) => {
      console.log('Received playlistUpdate:', newPlaylist);
      setPlaylist(newPlaylist);
    };
    socket.on('playlistUpdate', handlePlaylistUpdate);

    const handleKicked = (data: { message: string }) => {
      alert(data.message);
      window.location.href = '/';
    };
    socket.on('kicked', handleKicked);

    const handleBanned = (data: { message: string }) => {
      alert(data.message);
      window.location.href = '/';
    };
    socket.on('banned', handleBanned);

    const handleScreenShareRequest = (data: ScreenShareRequest) => {
      console.log('Received screen share request:', data);
      setScreenShareRequest(data);
    };
    
    const handleScreenSharePermission = ({ granted }: { granted: boolean }) => {
      if (granted) {
        setScreenSharePermissionGranted(true);
        toast.success('Permission granted! You can now start sharing your screen.');
      } else {
        toast.error('Host declined your screen share request.');
      }
    };

    socket.on('screenShareRequest', handleScreenShareRequest);
    socket.on('screenSharePermission', handleScreenSharePermission);

    socket.on('error', (data) => {
      if (data.message.includes('This username is already taken') ||
          data.message.includes('Username must be between 2 and 20 characters') ||
          data.message.includes('User not found in this room')) {
        console.info('User-facing socket message:', data.message);
      } else {
        console.error('Socket error:', data.message);
        alert(`Error: ${data.message}`);
      }
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('membersUpdate');
      socket.off('chatMessage');
      socket.off('historyUpdate', handleHistoryUpdate);
      socket.off('videoUpdate', handleVideoUpdate);
      socket.off('playlistUpdate', handlePlaylistUpdate);
      socket.off('kicked', handleKicked);
      socket.off('banned', handleBanned);
      socket.off('error');
      socket.off('syncPlayerState', handleSyncState);
      socket.off('initialState', handleSyncState);
      socket.off('getControllerState', handleGetControllerState);
      socket.off('screenShareRequest', handleScreenShareRequest);
      socket.off('screenSharePermission', handleScreenSharePermission);

      if (hasJoined.current && roomId && userId) {
        socket.emit('leaveRoom', { roomId, userId });
        hasJoined.current = false;
      }
    };
  }, [roomId, userId, username, getPlayerState]);

  const sendPlayerStateChange = useCallback(
    (state: PlayerState) => {
      console.log('%cHOST: Emitting playerStateChange:', 'color: orange; font-weight: bold;', state);
      socket.emit('playerStateChange', { roomId, state });
    },
    [roomId]
  );

  const sendChatMessage = useCallback(
    (text: string, replyTo?: { messageId: string; senderName: string; content: string }) => {
      if (text.trim() && username) {
        socket.emit('chatMessage', { roomId, text, username, replyTo });
      }
    },
    [roomId, username]
  );
  
  const updateUsername = useCallback(
    (newUsername: string) => {
      if (socket && userId) {
        console.log('Emitting updateUsername:', { roomId, userId, newUsername });
        socket.emit('updateUsername', { roomId, userId, newUsername });
      }
    },
    [roomId, userId]
  );

  const changeVideo = useCallback(
    (videoUrl: string) => {
      console.log('Emitting changeVideo:', { roomId, videoUrl });
      socket.emit('changeVideo', { roomId, videoUrl });
    },
    [roomId]
  );

  const addToPlaylist = useCallback(
    (videoUrl: string) => {
      console.log('Emitting addToPlaylist:', { roomId, videoUrl });
      socket.emit('addToPlaylist', { roomId, videoUrl });
    },
    [roomId]
  );

  const playNextVideo = useCallback(() => {
    console.log('Emitting playNextInQueue:', { roomId, mode: viewMode });
    socket.emit('playNextInQueue', { roomId, mode: viewMode });
  }, [roomId, viewMode]);

  const removePlaylistItem = useCallback(
    (videoUrl: string) => {
      console.log('Emitting removePlaylistItem:', { roomId, videoUrl });
      socket.emit('removePlaylistItem', { roomId, videoUrl });
    },
    [roomId]
  );

  const movePlaylistItem = useCallback(
    (videoUrl: string, direction: 'up' | 'down') => {
      console.log('Emitting movePlaylistItem:', { roomId, videoUrl, direction });
      socket.emit('movePlaylistItem', { roomId, videoUrl, direction });
    },
    [roomId]
  );

  const makeModerator = useCallback(
    (targetUserId: string) => {
      console.log('Emitting makeModerator:', { roomId, targetUserId });
      socket.emit('makeModerator', { roomId, targetUserId });
    },
    [roomId]
  );

  const removeModerator = useCallback(
    (targetUserId: string) => {
      console.log('Emitting removeModerator:', { roomId, targetUserId });
      socket.emit('removeModerator', { roomId, targetUserId });
    },
    [roomId]
  );

  const kickUser = useCallback(
    (targetUserId: string) => {
      console.log('Emitting kickUser:', { roomId, targetUserId });
      socket.emit('kickUser', { roomId, targetUserId });
    },
    [roomId]
  );

  const banUser = useCallback(
    (targetUserId: string) => {
      console.log('Emitting banUser:', { roomId, targetUserId });
      socket.emit('banUser', { roomId, targetUserId });
    },
    [roomId]
  );

  const requestScreenShare = useCallback(() => {
    socket.emit('screenShareRequest', { roomId });
  }, [roomId]);

  const respondToScreenShare = useCallback((requesterId: string, accepted: boolean) => {
    socket.emit('screenShareResponse', { roomId, requesterId, accepted });
    setScreenShareRequest(null);
  }, [roomId]);


  return {
    messages,
    members,
    history,
    currentVideoUrl,
    playlist,
    playerState,
    sendPlayerStateChange,
    sendChatMessage,
    changeVideo,
    addToPlaylist,
    playNextVideo,
    removePlaylistItem,
    movePlaylistItem,
    makeModerator,
    removeModerator,
    kickUser,
    banUser,
    updateUsername,
    requestScreenShare,
    respondToScreenShare,
    screenShareRequest,
    screenSharePermissionGranted,
    resetScreenSharePermission: () => setScreenSharePermissionGranted(false),
  };
}