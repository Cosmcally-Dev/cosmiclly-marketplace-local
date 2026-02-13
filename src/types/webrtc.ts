import type { ConnectionQuality } from './session';

/**
 * LiveKit connection state
 */
export type WebRTCState =
  | 'idle'           // Not initialized
  | 'requesting'     // Requesting LiveKit token
  | 'connecting'     // Connecting to LiveKit room
  | 'connected'      // Connected to room
  | 'reconnecting'   // Attempting reconnection
  | 'failed'         // Connection failed
  | 'closed';        // Connection closed

/**
 * LiveKit token response from Edge Function
 */
export interface LiveKitTokenResponse {
  token: string;     // JWT access token
  url: string;       // LiveKit server URL
  roomName: string;  // Room name (session-{sessionId})
}

/**
 * WebRTC statistics snapshot
 */
export interface WebRTCStats {
  timestamp: number;
  bytesReceived: number;
  bytesSent: number;
  packetsLost: number;
  packetsReceived: number;
  jitter: number;          // milliseconds
  roundTripTime: number;   // milliseconds
  audioLevel?: number;     // 0-1
  connectionQuality: ConnectionQuality;
}

/**
 * WebRTC hook configuration
 */
export interface WebRTCConfig {
  sessionId: string;
  userId: string;       // Current user ID
  sessionType: 'audio' | 'video';
  enabled: boolean;     // Control when to initialize
  onConnectionStateChange?: (state: WebRTCState) => void;
  onStats?: (stats: WebRTCStats) => void;
}
