// socket.ts
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

// Use environment variables for flexibility
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://socket-vomegle-3829a22c3f54.herokuapp.com/';

// Initialize Socket.io client
const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  upgrade: false,
  reconnection: true,
  reconnectionAttempts: Infinity, // Allow infinite reconnection attempts
  reconnectionDelay: 1000,        // Initial delay of 1 second
  reconnectionDelayMax: 3000,     // Maximum delay of 3 seconds
  timeout: 5000,                   // Connection timeout of 5 seconds
});

// Event: Successfully connected to the server
socket.on('connect', () => {
  // Connection established
});

// Event: Connection error occurred
socket.on('connect_error', () => {
  toast.error('Connection Error. Please check your internet and try again.');
});

// Event: Disconnected from the server
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Attempt to reconnect manually if the server initiated the disconnection
    socket.connect();
  }
});

// Event: Attempting to reconnect
socket.on('reconnect_attempt', () => {
  // Reconnection attempt in progress
});

// Event: Failed to reconnect after all attempts
socket.on('reconnect_failed', () => {
  toast.error('Unable to reconnect to the server. Please refresh the page.');
});

export default socket;
