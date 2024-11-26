import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const TEXT_NAMESPACE = '/text';
const DEFAULT_NAMESPACE = '/';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'https://vimegle-backend.onrender.com';

declare global {
  interface Window {
    textSocket: Socket;
    defaultSocket: Socket;
  }
}

if (typeof window !== 'undefined') {
  if (!window.textSocket) {
    //console.log('Initializing new Socket.io client for /text namespace');

    const savedSessionId = localStorage.getItem('sessionId');

    window.textSocket = io(`${SOCKET_URL}${TEXT_NAMESPACE}`, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        sessionId: savedSessionId || '',
      },
    });

    window.textSocket.on('connect', () => {
      //console.log('Text Socket connected:', window.textSocket.id);
    });

    window.textSocket.on('session', ({ sessionId }) => {
      //console.log('Received sessionId from server:', sessionId);
      localStorage.setItem('sessionId', sessionId);
      window.textSocket.auth = { sessionId };
    });

    window.textSocket.on('connect_error', (error) => {
      //console.error('Connection Error (Text Chat):', error);
      toast.error(
        'Connection Error (Text Chat). Please check your internet and try again.'
      );
    });

    window.textSocket.on('disconnect', (reason: string) => {
      //console.log('Text Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        window.textSocket.connect();
      }
    });

    window.textSocket.on('reconnect_attempt', () => {
      //console.log('Text Socket reconnecting...');
    });

    window.textSocket.on('reconnect_failed', () => {
      toast.error(
        'Unable to reconnect to the Text Chat server. Please refresh the page.'
      );
    });
  }

  if (!window.defaultSocket) {
    //console.log('Initializing new Socket.io client for default namespace');

    window.defaultSocket = io(`${SOCKET_URL}${DEFAULT_NAMESPACE}`, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    window.defaultSocket.on('connect', () => {
      //console.log('Default Socket connected:', window.defaultSocket.id);
    });

    window.defaultSocket.on('connect_error', (error) => {
      //console.error('Connection Error (Default):', error);
      toast.error(
        'Connection Error (Default). Please check your internet and try again.'
      );
    });

    window.defaultSocket.on('disconnect', (reason: string) => {
      //console.log('Default Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        window.defaultSocket.connect();
      }
    });

    window.defaultSocket.on('reconnect_attempt', () => {
      //console.log('Default Socket reconnecting...');
    });

    window.defaultSocket.on('reconnect_failed', () => {
      toast.error(
        'Unable to reconnect to the Default server. Please refresh the page.'
      );
    });
  }
}

const textSocket: Socket =
  typeof window !== 'undefined' ? window.textSocket : ({} as Socket);
const defaultSocket: Socket =
  typeof window !== 'undefined' ? window.defaultSocket : ({} as Socket);

export { textSocket, defaultSocket };
