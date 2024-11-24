import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    socket: Socket;
  }

  interface Navigator {
    connection?: NetworkInformation;
  }

  interface NetworkInformation extends EventTarget {
    downlink: number;
    effectiveType: string;
    rtt: number;
    saveData: boolean;
    type: string;
    onchange: ((this: NetworkInformation, ev: Event) => any) | null;
  }
}

export {};
