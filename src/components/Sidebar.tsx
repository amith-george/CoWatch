'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  UserIcon,
  ComputerDesktopIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/solid';
import HelperModal from './HelperModal';

const ICON_BOX_CLASSES =
  'p-3 rounded-lg bg-[#1f1f1f] hover:bg-gray-700 transition-colors';

// Define props for the component
interface SidebarProps {
  username: string | null;
  onProfileClick: () => void; // Handler for profile clicks
}

export default function Sidebar({ username, onProfileClick }: SidebarProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const sidebarItems = [
    {
      label: 'Screen',
      icon: ComputerDesktopIcon,
      onClick: () => {},
    },
    {
      label: 'Help',
      icon: QuestionMarkCircleIcon,
      onClick: () => setIsHelpModalOpen(true),
    },
    {
      label: 'Profile',
      icon: UserIcon,
      onClick: onProfileClick,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex fixed top-0 left-0 h-screen w-24 bg-[#1f1f1f] text-white flex-col justify-between items-center py-6 shadow-lg">
        <div className="flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="WatchTogether+ Logo"
            width={64}
            height={64}
            className="object-contain"
            priority
          />
        </div>

        <div className="flex flex-col items-center space-y-10 font-sans text-sm">
          <div className="flex flex-col items-center space-y-6 mb-4">
            {sidebarItems.slice(0, 2).map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center text-white group"
              >
                <div className={ICON_BOX_CLASSES}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="mt-1">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={sidebarItems[2].onClick}
            className="flex flex-col items-center text-white group"
          >
            <div className={ICON_BOX_CLASSES}>
              <UserIcon className="w-8 h-8" />
            </div>
            <p className="mt-1 text-sm font-medium text-center truncate w-20 px-1">
              {username || 'Guest'}
            </p>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <aside className="sm:hidden fixed bottom-0 left-0 w-full bg-[#1f1f1f] text-white flex justify-around items-center px-2 py-3 shadow-lg z-20">
        {sidebarItems.map(({ label, icon: Icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center text-white group text-xs"
          >
            <div className="p-2 rounded-md bg-[#1f1f1f] group-hover:bg-gray-700 transition-colors">
              <Icon className="w-6 h-6" />
            </div>
            <span className="mt-1">{label}</span>
          </button>
        ))}
      </aside>

      {/* Help Modal */}
      {isHelpModalOpen && <HelperModal onClose={() => setIsHelpModalOpen(false)} />}
    </>
  );
}