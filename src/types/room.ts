// types/room.ts

export interface RoomUser {
  userId: string;
  username: string;
}

export type MemberRole = 'Host' | 'Moderator' | 'Participant';

export interface Member extends RoomUser {
  role: MemberRole;
  socketId: string;
}


export interface ChatMessage {
  _id: string;
  type: 'system' | 'user'; 
  content: string;
  senderId: string;
  senderName: string; 
  senderRole: MemberRole; 
  sentAt: string; 
  replyTo?: {
    messageId: string;
    senderName: string;
    content: string;
  };
}


export type SearchPlatform = 'youtube' | 'twitch';

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

export interface VideoItem {
  videoId: string;
  thumbnailUrl: string;
  title: string;
  channelTitle: string;
  videoUrl: string;
  isAgeRestricted?: boolean; 
}