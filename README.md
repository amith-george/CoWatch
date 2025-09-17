## 🎬 CoWatch — Synchronized Media Viewing and Real-Time Collaboration Platform

### 🧩 Overview

CoWatch is a full-stack web application that enables anyone to create temporary virtual rooms where participants can watch YouTube videos or Twitch streams together in real time. Users do not need to register to create or join rooms—just access the site, create a room by entering a video URL, set a session duration, and invite others via the shared room link. All playback is perfectly synchronized for everyone in the room, creating a shared viewing experience.

In addition to media playback, the platform includes real-time text chat and screen sharing via WebRTC, making it ideal for not just watch parties but also casual meetups or quick collaboration. Rooms are automatically deleted after the time set by the host during creation, ensuring efficient resource usage and privacy. The app is entirely browser-based and optimized for both desktop and mobile usage.

### ⚙️ Core Features

🎥 Media Sync and Playback

Supports YouTube and Twitch via public URLs (no login required).

Room creator (host) can control playback and assign other users as moderators.

Viewers can watch but cannot control playback.

Socket.IO ensures real-time synchronization of playback actions across users.

💬 Real-Time Chat

Simple text-only chat integrated into each room.

Chat messages are temporary and vanish when the room ends.

No support for emojis, typing indicators, or message history—kept lightweight for speed.

🖥️ Screen Sharing (WebRTC)

One user at a time can share:

A browser tab,

A specific application window, or

Their entire screen.

Sharing is live via WebRTC and not recorded.

🧑‍🤝‍🧑 Room Management

Anyone (registered or not) can create rooms.

Creator sets a custom duration (e.g., 30 mins, 1 hour) for how long the room will last.

Rooms are automatically deleted from the system once they expire.

Participants can rejoin the room if disconnected during the active session.

Room creator can assign moderators or restrict users to viewer-only mode.

Moderation tools include kick/ban options for host/mods.

🔐 Roles & Permissions

Host: Creator of the room, full access to video and user controls.

Moderator: Can control video and kick users.

Viewer: Can only watch and chat.

### 🛠️ Technical Stack

Frontend - Next.js + Tailwind CSS
Backend - Node.js + Express
Database - MongoDB Atlas
Auth - JWT (used optionally for enhanced features)
Real-time - Socket.IO
Screen Sharing - WebRTC
Deployment - Vercel (frontend), Render (backend), MongoDB Atlas (database)

