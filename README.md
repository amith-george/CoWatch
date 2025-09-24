# 🎬 CoWatch

CoWatch is a full-stack web application that enables users to watch YouTube and Twitch streams together in synchronized virtual rooms. With integrated real-time chat and WebRTC screen sharing, it's the perfect platform for watch parties, casual meetups, or quick collaborations—no registration required.

Live Site: https://co-watch-psi.vercel.app/

---

### 🌟 Key Features

* **Synchronized Playback:** Watch YouTube videos and Twitch streams with friends, with playback controlled by the host for a seamless shared experience.
* **Real-Time Chat:** Every room includes a lightweight, real-time chat for instant communication.
* **High-Quality Screen Sharing:** Share a browser tab, an application, or your entire screen with the room using WebRTC for low-latency streaming.
* **No Accounts Needed:** Jump right in. Create a room by pasting a URL, set a duration, and invite friends with a simple link.
* **Full Room Control:** The host can manage the video queue, assign moderators, and moderate the room with kick/ban tools.
* **Ephemeral & Private:** Rooms and their chat histories are automatically deleted after the session expires, ensuring your privacy.

---

### 🛠️ Tech Stack

This project is a monorepo containing two main parts: a Next.js frontend and a Node.js backend.

| Area                  | Technology                                     |
| --------------------- | ---------------------------------------------- |
| **Frontend**          | Next.js (React), Tailwind CSS, Framer Motion   |
| **Backend**           | Node.js, Express.js                            |
| **Real-Time Engine**  | Socket.IO, WebRTC (for screen sharing)         |
| **Database**          | MongoDB (with Mongoose)                        |
| **Third-Party APIs**  | YouTube Data API v3, Twitch API                |
| **Deployment**        | Vercel (Frontend), Render (Backend)            |

---

