import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:4000";

// Create and export a single socket instance
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});
