'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { socket } from '@/utils/socket';
import { ChatMessage, Member } from '@/types/room';

// Define a type for the player's state object for type safety
export interface PlayerState {
  time: number;
  // Common player states: 1=playing, 2=paused, 3=buffering, 0=ended
  status: 1 | 2 | 3 | 0;
}

// [NEW] Define a type for the complete initial state payload
export interface InitialState extends PlayerState {
  videoUrl?: string; // videoUrl is optional for other sync events
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
  const hasJoined = useRef(false);

  useEffect(() => {
    // Sync state if initial data changes after fetch
    setHistory(initialHistory);
    setCurrentVideoUrl(initialVideoUrl);
    setPlaylist(initialPlaylist);
  }, [initialHistory, initialVideoUrl, initialPlaylist]);

  // Fetch stored messages from backend when roomId is available
  useEffect(() => {
    const fetchStoredMessages = async () => {
      if (!roomId) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API}/messages/${roomId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();

        const storedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
          type: 'user',
          text: msg.text,
          username: msg.username,
          role: msg.role,
        }));

        setMessages(storedMessages);
      } catch (err) {
        console.error('Error loading stored messages:', err);
      }
    };

    fetchStoredMessages();
  }, [roomId]);

  // Socket connection + real-time message handling
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
      // [DEBUG] This log confirms the VIEWER received the event
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
    socket.on('chatMessage', (data) => {
      setMessages((prev) => [...prev, { type: 'user', text: data.text, username: data.username, role: data.role }]);
    });

    const handleHistoryUpdate = ({ history: newHistory }: { history: string[] }) => setHistory(newHistory);
    socket.on('historyUpdate', handleHistoryUpdate);

    const handleVideoUpdate = ({ videoUrl }: { videoUrl: string }) => {
      setCurrentVideoUrl((currentUrl) => (currentUrl !== videoUrl ? videoUrl : currentUrl));
    };
    socket.on('videoUpdate', handleVideoUpdate);

    const handlePlaylistUpdate = ({ playlist: newPlaylist }: { playlist: string[] }) => setPlaylist(newPlaylist);
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

    socket.on('error', (data) => console.error('Socket error:', data.message));

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

      if (hasJoined.current && roomId && userId) {
        socket.emit('leaveRoom', { roomId, userId });
        hasJoined.current = false;
      }
    };
  }, [roomId, userId, username, getPlayerState]);

  const sendPlayerStateChange = useCallback(
    (state: PlayerState) => {
      // [DEBUG] This log confirms the HOST is sending the event
      console.log('%cHOST: Emitting playerStateChange:', 'color: orange; font-weight: bold;', state);
      socket.emit('playerStateChange', { roomId, state });
    },
    [roomId]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      if (text.trim() && username) {
        socket.emit('chatMessage', { roomId, text, username });
      }
    },
    [roomId, username]
  );

  const changeVideo = useCallback(
    (videoUrl: string) => {
      socket.emit('changeVideo', { roomId, videoUrl });
    },
    [roomId]
  );

  const addToPlaylist = useCallback(
    (videoUrl: string) => {
      socket.emit('addToPlaylist', { roomId, videoUrl });
    },
    [roomId]
  );

  const playNextVideo = useCallback(() => {
    socket.emit('playNextInQueue', { roomId, mode: viewMode });
  }, [roomId, viewMode]);

  const makeModerator = useCallback(
    (targetUserId: string) => {
      socket.emit('makeModerator', { roomId, targetUserId });
    },
    [roomId]
  );

  const removeModerator = useCallback(
    (targetUserId: string) => {
      socket.emit('removeModerator', { roomId, targetUserId });
    },
    [roomId]
  );

  const kickUser = useCallback(
    (targetUserId: string) => {
      socket.emit('kickUser', { roomId, targetUserId });
    },
    [roomId]
  );

  const banUser = useCallback(
    (targetUserId: string) => {
      socket.emit('banUser', { roomId, targetUserId });
    },
    [roomId]
  );

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
    makeModerator,
    removeModerator,
    kickUser,
    banUser,
  };
}