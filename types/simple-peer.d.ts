import 'simple-peer';

declare module 'simple-peer' {
  interface Instance {
    peer: RTCPeerConnection;
  }
}