// src/components/ChatTab/ChatTab.tsx

'use client';

import { useState } from 'react';
import { ChatMessage, Member, VideoItem } from '@/types/room';
import { motion, AnimatePresence } from 'framer-motion';
import TabButtons from './TabButtons';
import ChatMessagesPanel from './MessagePanel';
import PlaylistsPanel from './PlaylistPanel';
import HistoryPanel from './HistoryPanel';
import MembersPanel from './MembersPanel';

interface ChatTabProps {
  viewMode: 'list' | 'shuffle';
  setViewMode: (mode: 'list' | 'shuffle') => void;
  activeTab: 'chat' | 'playlists' | 'history' | 'members';
  setActiveTab: (tab: 'chat' | 'playlists' | 'history' | 'members') => void;
  currentUserId: string;
  messages: ChatMessage[];
  members: Member[];
  sendChatMessage: (msg: string) => void;
  makeModerator: (targetUserId: string) => void;
  removeModerator: (targetUserId: string) => void;
  kickUser: (targetUserId: string) => void;
  banUser: (targetUserId: string) => void;
  historyVideos: VideoItem[];
  isHistoryLoading: boolean;
  playlistVideos: VideoItem[];
  isPlaylistLoading: boolean;
  removePlaylistItem: (videoUrl: string) => void;
  movePlaylistItem: (videoUrl: string, direction: 'up' | 'down') => void;
  isController: boolean; // Add this
}

export default function ChatTab({
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  currentUserId,
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
  isController, // Destructure new prop
}: ChatTabProps) {
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  const panelVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] border border-gray-700/50 rounded-r-xl overflow-hidden shadow-lg">
      <TabButtons 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        memberCount={members.length}
      />

      <div className="flex-1 text-sm text-gray-300 min-h-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.15 }}
            className="h-full w-full absolute"
          >
            {activeTab === 'chat' && (
              <ChatMessagesPanel
                messages={messages}
                sendChatMessage={sendChatMessage}
              />
            )}

            {activeTab === 'playlists' && (
              <div className="h-full overflow-y-auto">
                <PlaylistsPanel
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  videos={playlistVideos}
                  isLoading={isPlaylistLoading}
                  onRemovePlaylistItem={removePlaylistItem}
                  onMovePlaylistItem={movePlaylistItem}
                  isController={isController} // Pass to PlaylistsPanel
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="h-full overflow-y-auto px-4 py-6">
                <HistoryPanel 
                  videos={historyVideos} 
                  isLoading={isHistoryLoading} 
                />
              </div>
            )}

            {activeTab === 'members' && (
              <div className="h-full overflow-y-auto px-4 py-6">
                <MembersPanel
                  members={members}
                  currentUserId={currentUserId}
                  openMenuFor={openMenuFor}
                  setOpenMenuFor={setOpenMenuFor}
                  makeModerator={makeModerator}
                  removeModerator={removeModerator}
                  kickUser={kickUser}
                  banUser={banUser}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}