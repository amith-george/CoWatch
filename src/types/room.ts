// types/room.ts

export interface RoomUser {
  userId: string;
  username: string;
}

export type MemberRole = 'Host' | 'Moderator' | 'Participant';

export interface Member extends RoomUser {
  role: MemberRole;
}

// Chat message type used in sockets and UI
export interface ChatMessage {
  type: 'system' | 'user';       // 'system' for join/leave notices, 'user' for chat
  text: string;                  // actual text of the message
  username?: string;             // who sent the message (optional for system)
  role?: MemberRole;             
}

/**
 * --- UPDATED ---
 * This type now more accurately reflects the complete Room object
 * received from your backend API. Renamed from RoomData for clarity.
 */
export interface Room {
  _id: string;
  roomId: string;
  roomName: string;
  host: RoomUser;
  moderators: RoomUser[];
  participants: RoomUser[];
  videoUrl?: string;
  history: string[];
  queue: string[];
  bannedUsers: string[];
  duration: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

/**
 * --- UPDATED ---
 * This type now matches the standardized response from your YouTube service.
 * - `id` is now `videoId` for clarity.
 * - `thumbnail` is now `thumbnailUrl`.
 * - Added `videoUrl` for convenience.
 */
export interface VideoItem {
  videoId: string;
  thumbnailUrl: string;
  title: string;
  channelTitle: string;
  videoUrl: string;
  isAgeRestricted?: boolean; 
}