import { io, Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie'; 

const TEXT_NAMESPACE = '/text';
const DEFAULT_NAMESPACE = '/';
const VOICE_NAMESPACE = '/voice'; 

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.vimegle.com';

declare global {
  interface Window {
    textSocket: Socket;
    defaultSocket: Socket;
    voiceSocket: Socket; 
  }
}

const SESSION_COOKIE_NAME = 'sessionId'; 

if (typeof window !== 'undefined') {
  const savedSessionId = Cookies.get(SESSION_COOKIE_NAME);

  if (!window.textSocket) {
    //console.log('Initializing new Socket.io client for /text namespace');

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

    let isBanned = false; 

    let currentRoom: string | null = null;

    window.textSocket.on('connect', () => {
      //console.log('Text Socket connected:', window.textSocket.id);
      isBanned = false;
      
      if (currentRoom) {
        window.textSocket.emit('sync_messages', { room: currentRoom });
      }
    });

    window.textSocket.on('session', ({ sessionId }) => {
      //console.log('Received sessionId from server (text):', sessionId);
      Cookies.set(SESSION_COOKIE_NAME, sessionId, {
        expires: 7, 
        sameSite: 'lax', 
        secure: true, 
        path: '/', 
      });
      window.textSocket.auth = { sessionId };
      window.textSocket.connect();
    });

    window.textSocket.on('partnerBanned', ({ message }) => {
      //console.log('Partner was banned:', message);
      toast.error(message);
    });

    window.textSocket.on('duplicateConnection', ({ message }) => {
      toast.error(message);
    });

    window.textSocket.on('message_sync', ({ messages }) => {
      window.dispatchEvent(new CustomEvent('message_sync', {
        detail: { messages }
      }));
    });

    
    window.textSocket.on('banned', ({ message }) => {
      //console.log('Received banned event (text):', message);
      toast.error(message);
      isBanned = true; 
      window.textSocket.io.opts.reconnection = false; 
      window.textSocket.disconnect(); 
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
        //console.log('Reconnecting Text Socket...');
        if (!isBanned) { 
          window.textSocket.connect();
        }
      }
    });

    window.textSocket.on('reconnect_attempt', () => {
      if (isBanned) {
        //console.log('Banned user (text) is not attempting to reconnect.');
        window.textSocket.io.opts.reconnection = false; 
      } else {
        //console.log('Text Socket reconnecting...');
      }
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
      auth: {
        sessionId: savedSessionId || '', 
      },
    });

    let isBannedDefault = false; 

    window.defaultSocket.on('connect', () => {
      //console.log('Default Socket connected:', window.defaultSocket.id);
      isBannedDefault = false;
    });

    window.defaultSocket.on('session', ({ sessionId }) => {
      //console.log('Received sessionId from server (default):', sessionId);
      Cookies.set(SESSION_COOKIE_NAME, sessionId, {
        expires: 7,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });
      window.defaultSocket.auth = { sessionId };
      window.defaultSocket.connect();
    });

    window.defaultSocket.on('partnerBanned', ({ message }) => {
      //console.log('Partner was banned:', message);
      toast.error(message);
    });

    window.defaultSocket.on('duplicateConnection', ({ message }) => {
      toast.error(message);
    });

    window.defaultSocket.on('banned', ({ message }) => {
      //console.log('Received banned event (default):', message);
      toast.error(message);
      isBannedDefault = true;
      window.defaultSocket.io.opts.reconnection = false;
      window.defaultSocket.disconnect();
    });

    window.defaultSocket.on('connect_error', (error) => {
      console.error('Connection Error (Default):', error);
      toast.error(
        'Connection Error (Default). Please check your internet and try again.'
      );
    });

    window.defaultSocket.on('disconnect', (reason: string) => {
      //console.log('Default Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        //console.log('Reconnecting Default Socket...');
        if (!isBannedDefault) {
          window.defaultSocket.connect();
        }
      }
    });

    window.defaultSocket.on('reconnect_attempt', () => {
      if (isBannedDefault) {
        //console.log('Banned user is not attempting to reconnect (default).');
        window.defaultSocket.io.opts.reconnection = false;
      } else {
        //console.log('Default Socket reconnecting...');
      }
    });

    window.defaultSocket.on('reconnect_failed', () => {
      toast.error(
        'Unable to reconnect to the Default server. Please refresh the page.'
      );
    });
  }

  if (!window.voiceSocket) {
    //console.log('Initializing new Socket.io client for /voiceChat namespace');

    window.voiceSocket = io(`${SOCKET_URL}${VOICE_NAMESPACE}`, {
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

    let isBannedVoice = false; 

    window.voiceSocket.on('connect', () => {
      //console.log('Voice Socket connected:', window.voiceSocket.id);
      isBannedVoice = false;
    });

    window.voiceSocket.on('session', ({ sessionId }) => {
      //console.log('Received sessionId from server (voice):', sessionId);
      Cookies.set(SESSION_COOKIE_NAME, sessionId, {
        expires: 7, 
        sameSite: 'lax', 
        secure: true, 
        path: '/', 
      });
      window.voiceSocket.auth = { sessionId };
      window.voiceSocket.connect();
    });

    window.voiceSocket.on('partnerBanned', ({ message }) => {
      //console.log('Partner was banned (voice):', message);
      toast.error(message);
    });

    window.voiceSocket.on('duplicateConnection', ({ message }) => {
      toast.error(message);
    });

    window.voiceSocket.on('banned', ({ message }) => {
      //console.log('Received banned event (voice):', message);
      toast.error(message);
      isBannedVoice = true; 
      window.voiceSocket.io.opts.reconnection = false; 
      window.voiceSocket.disconnect(); 
    });

    window.voiceSocket.on('connect_error', (error) => {
      //console.error('Connection Error (Voice Chat):', error);
      toast.error(
        'Connection Error (Voice Chat). Please check your internet and try again.'
      );
    });

    window.voiceSocket.on('disconnect', (reason: string) => {
      //console.log('Voice Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        //console.log('Reconnecting Voice Socket...');
        if (!isBannedVoice) { 
          window.voiceSocket.connect();
        }
      }
    });

    window.voiceSocket.on('reconnect_attempt', () => {
      if (isBannedVoice) {
        //console.log('Banned user (voice) is not attempting to reconnect.');
        window.voiceSocket.io.opts.reconnection = false; 
      } else {
        //console.log('Voice Socket reconnecting...');
      }
    });

    window.voiceSocket.on('reconnect_failed', () => {
      toast.error(
        'Unable to reconnect to the Voice Chat server. Please refresh the page.'
      );
    });
  }
}

const textSocket: Socket =
  typeof window !== 'undefined' ? window.textSocket : ({} as Socket);
const defaultSocket: Socket =
  typeof window !== 'undefined' ? window.defaultSocket : ({} as Socket);
const voiceSocket: Socket =
  typeof window !== 'undefined' ? window.voiceSocket : ({} as Socket); 

export { textSocket, defaultSocket, voiceSocket };
