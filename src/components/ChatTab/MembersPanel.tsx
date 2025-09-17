'use client';

import {
  EllipsisVerticalIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  StarIcon,
  UserMinusIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/solid';
import { Member } from '@/types/room';
import { useRef, useEffect, useMemo } from 'react';

// --- UPDATED AVATAR COMPONENT ---
// It now accepts a 'role' to determine the background color.
const UserAvatar = ({ username, role }: { username:string; role: string; }) => {
  const initial = username.charAt(0).toUpperCase();
  
  let bgColor = 'bg-gray-500'; // Default for Participant
  if (role === 'Host') {
    bgColor = 'bg-yellow-500';
  } else if (role === 'Moderator') {
    bgColor = 'bg-sky-500';
  }

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl ${bgColor}`}
    >
      {initial}
    </div>
  );
};


interface MembersPanelProps {
  members: Member[];
  currentUserId: string;
  openMenuFor: string | null;
  setOpenMenuFor: (id: string | null) => void;
  makeModerator: (targetUserId: string) => void;
  removeModerator: (targetUserId: string) => void;
  kickUser: (targetUserId: string) => void;
  banUser: (targetUserId: string) => void;
}

export default function MembersPanel({
  members,
  currentUserId,
  openMenuFor,
  setOpenMenuFor,
  makeModerator,
  removeModerator,
  kickUser,
  banUser,
}: MembersPanelProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const isHost = members.some(m => m.role === 'Host' && m.userId === currentUserId);
  const isModerator = members.some(m => m.role === 'Moderator' && m.userId === currentUserId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuFor(null);
      }
    };
    if (openMenuFor) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuFor, setOpenMenuFor]);

  const sortedMembers = useMemo(() => {
    const roleOrder = {
      'Host': 1,
      'Moderator': 2,
      'Participant': 3,
    };
    return [...members].sort((a, b) => {
      const orderA = roleOrder[a.role as keyof typeof roleOrder] || 99;
      const orderB = roleOrder[b.role as keyof typeof roleOrder] || 99;
      const roleDifference = orderA - orderB;
      if (roleDifference !== 0) {
        return roleDifference;
      }
      return a.username.localeCompare(b.username);
    });
  }, [members]);

  const canManage = (member: Member) => {
    if (member.userId === currentUserId || member.role === 'Host') {
        return false;
    }
    if (isHost) {
        return true;
    }
    if (isModerator && member.role === 'Participant') {
        return true;
    }
    return false;
  };

  const getRoleIcon = (role: string) => {
    if (role === 'Host') {
      return <UserCircleIcon className="w-5 h-5 text-yellow-400" title="Host" />;
    }
    if (role === 'Moderator') {
      return <ShieldCheckIcon className="w-5 h-5 text-sky-400" title="Moderator" />;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      {sortedMembers.map(member => {
        const showMenuButton = canManage(member);

        return (
          <div
            key={member.userId}
            className={`flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors duration-150 group ${
              openMenuFor === member.userId ? 'bg-gray-800' : ''
            }`}
          >
            {/* --- FIX: Pass the member's role to the UserAvatar --- */}
            <UserAvatar username={member.username} role={member.role} />
            <div className="ml-3 flex-grow">
              <p className="font-semibold text-white">{member.username}</p>
              {/* --- FIX: Dynamically set the color of the role text --- */}
              <p className={`text-sm font-medium ${
                  member.role === 'Host' ? 'text-yellow-400' :
                  member.role === 'Moderator' ? 'text-sky-400' :
                  'text-gray-400'
                }`}
              >
                {member.role}
              </p>
            </div>
            
            <div className="flex items-center gap-3 ml-auto">
              {getRoleIcon(member.role)}
              
              {showMenuButton && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuFor(openMenuFor === member.userId ? null : member.userId)
                    }
                    className="p-2 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-700 transition-opacity"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
                  </button>

                  {openMenuFor === member.userId && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20"
                    >
                      <ul className="text-sm text-gray-200">
                        {isHost && member.role === 'Participant' && (
                          <li
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              makeModerator(member.userId);
                              setOpenMenuFor(null);
                            }}
                          >
                            <StarIcon className="w-4 h-4" />
                            <span>Make Moderator</span>
                          </li>
                        )}
                        
                        {isHost && member.role === 'Moderator' && (
                          <li
                            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              removeModerator(member.userId);
                              setOpenMenuFor(null);
                            }}
                          >
                            <NoSymbolIcon className="w-4 h-4" />
                            <span>Remove Moderator</span>
                          </li>
                        )}

                        <li
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            kickUser(member.userId);
                            setOpenMenuFor(null);
                          }}
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          <span>Kick Member</span>
                        </li>
                        <li
                          className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 cursor-pointer"
                          onClick={() => {
                            banUser(member.userId);
                            setOpenMenuFor(null);
                          }}
                        >
                          <UserMinusIcon className="w-4 h-4" />
                          <span>Ban Member</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}