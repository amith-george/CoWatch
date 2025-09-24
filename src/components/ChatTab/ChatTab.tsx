// src/components/ChatTab/ChatTab.tsx

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '@/contexts/RoomContext'; 
import TabButtons from './TabButtons';
import ChatMessagesPanel from './MessagePanel';
import PlaylistsPanel from './PlaylistPanel';
import HistoryPanel from './HistoryPanel';
import MembersPanel from './MembersPanel';

// ✨ 2. The entire 'ChatTabProps' interface has been removed.

export default function ChatTab() {
  // ✨ 3. State that controls the UI of this component now lives here.
  const [activeTab, setActiveTab] = useState<'chat' | 'playlists' | 'history' | 'members'>('chat');
  
  // ✨ 4. Data needed by this component (or its direct children) is pulled from the context.
  const { members } = useRoom();

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
            {/* ✨ 5. The child panels no longer receive any props. 
                   They will be refactored next to use the useRoom() hook themselves. */}
            {activeTab === 'chat' && (
              <ChatMessagesPanel />
            )}

            {activeTab === 'playlists' && (
              <div className="h-full overflow-y-auto">
                <PlaylistsPanel />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="h-full overflow-y-auto px-4 py-6">
                <HistoryPanel />
              </div>
            )}

            {activeTab === 'members' && (
              <div className="h-full overflow-y-auto px-4 py-6">
                <MembersPanel />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}