// lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001/';

declare global {
  interface Window {
    socket: Socket;
  }
}

if (typeof window !== 'undefined') {
  if (!window.socket) {
    console.log('Initializing new Socket.io client');
    window.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 5000,
    });

    // Event: Successfully connected to the server
    window.socket.on('connect', () => {
      console.log('Socket connected:', window.socket.id);
    });

    // Event: Connection error occurred
    window.socket.on('connect_error', () => {
      toast.error('Connection Error. Please check your internet and try again.');
    });

    // Event: Disconnected from the server
    window.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Attempt to reconnect manually if the server initiated the disconnection
        window.socket.connect();
      }
    });

    // Event: Attempting to reconnect
    window.socket.on('reconnect_attempt', () => {
      console.log('Reconnecting...');
    });

    // Event: Failed to reconnect after all attempts
    window.socket.on('reconnect_failed', () => {
      toast.error('Unable to reconnect to the server. Please refresh the page.');
    });
  } else {
    console.log('Using existing Socket.io client');
  }
}

const socket: Socket = typeof window !== 'undefined' ? window.socket : ({} as Socket);

export default socket;
