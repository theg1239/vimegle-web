import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://socket-vomegle-3829a22c3f54.herokuapp.com/';

const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket'],
  upgrade: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on('ping', () => {
  socket.emit('pong');
});

socket.on('reconnect_attempt', () => {
  console.log('Attempting to reconnect to the server...');
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection attempts failed.');
});

export default socket;
