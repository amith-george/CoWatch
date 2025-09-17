'use client';

import { motion } from 'framer-motion';
import {
  ChatBubbleLeftEllipsisIcon,
  QueueListIcon,
  ClockIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'; // Using outline icons for a cleaner look

interface TabButtonsProps {
  activeTab: 'chat' | 'playlists' | 'history' | 'members';
  setActiveTab: (tab: 'chat' | 'playlists' | 'history' | 'members') => void;
  memberCount?: number;
}

export default function TabButtons({ activeTab, setActiveTab, memberCount = 0 }: TabButtonsProps) {
  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: ChatBubbleLeftEllipsisIcon },
    { id: 'playlists' as const, label: 'Playlists', icon: QueueListIcon },
    { id: 'history' as const, label: 'History', icon: ClockIcon },
    { id: 'members' as const, label: 'Members', icon: UsersIcon },
  ];

  return (
    <div className="flex items-center justify-between border-b border-gray-700/50 px-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors duration-150 focus:outline-none ${
            activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }} // For mobile
        >
          <tab.icon className="h-5 w-5" />
          <span>{tab.id === 'members' ? `${tab.label} (${memberCount})` : tab.label}</span>

          {/* Animated underline for the active tab */}
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
              style={{ borderRadius: '2px' }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}