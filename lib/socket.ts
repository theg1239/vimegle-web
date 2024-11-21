import { io } from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

const socket = io(`${SERVER_URL}/text`, {
  autoConnect: false, 
  withCredentials: true,
});

export default socket;
