// socket.js
import { io, Socket } from 'socket.io-client';

// Replace with your actual server URL
const SOCKET_URL = 'https://socket-vomegle-3829a22c3f54.herokuapp.com/';

// Initialize Socket.io Client with Enhanced Configuration
const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity, // Unlimited reconnection attempts
  reconnectionDelay: 1000, // 1 second delay between reconnection attempts
  reconnectionDelayMax: 5000, // Maximum delay of 5 seconds
  randomizationFactor: 0.5, // Randomization factor for reconnection delay
  timeout: 20000, // 20 seconds before a connection attempt is considered failed
});

// Handle 'ping' Event for Heartbeat
socket.on('ping', () => {
  socket.emit('pong');
});

// Optional: Handle Additional Socket.io Events
socket.on('connect_error', (err) => {
  console.error('Connection Error:', err.message);
});

socket.on('connect_timeout', () => {
  console.warn('Connection Timeout');
});

export default socket;
