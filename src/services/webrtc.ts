import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  LocalTrackPublication,
  ConnectionQuality as LKConnectionQuality,
} from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import type {
  WebRTCState,
  WebRTCStats,
  LiveKitTokenResponse,
} from '@/types/webrtc';
import type { ConnectionQuality } from '@/types/session';

export interface LiveKitServiceConfig {
  sessionId: string;
  sessionType: 'audio' | 'video';
  onStateChange: (state: WebRTCState) => void;
  onRemoteTrack: (track: MediaStreamTrack, stream: MediaStream) => void;
  onStats: (stats: WebRTCStats) => void;
  onError: (error: Error) => void;
}

export class WebRTCService {
  private room: Room | null = null;
  private statsInterval: ReturnType<typeof setInterval> | null = null;
  private config: LiveKitServiceConfig;
  private state: WebRTCState = 'idle';
  private isDestroyed = false;

  constructor(config: LiveKitServiceConfig) {
    this.config = config;
  }

  /**
   * Initialize LiveKit connection
   * 1. Fetch LiveKit token from Edge Function
   * 2. Create Room and connect
   * 3. Publish local audio track
   */
  async initialize(): Promise<void> {
    if (this.isDestroyed) return;

    try {
      this.setState('requesting');

      // Fetch LiveKit token
      const tokenData = await this.fetchLiveKitToken();

      this.setState('connecting');

      // Create and configure room
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.setupRoomEvents();

      // Connect to room
      await this.room.connect(tokenData.url, tokenData.token);

      // Publish local microphone
      await this.room.localParticipant.setMicrophoneEnabled(true);

      if (this.config.sessionType === 'video') {
        await this.room.localParticipant.setCameraEnabled(true);
      }

      console.log('[LiveKit] Connected to room:', tokenData.roomName);
    } catch (error: any) {
      console.error('[LiveKit] Initialization failed:', error);

      // Map common errors
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission')) {
        this.setState('failed');
        this.config.onError(new Error('PERMISSION_DENIED: Microphone access was denied. Please allow microphone access in your browser settings.'));
        return;
      }
      if (error.name === 'NotFoundError') {
        this.setState('failed');
        this.config.onError(new Error('NO_DEVICE: No microphone found. Please connect a microphone and try again.'));
        return;
      }

      this.setState('failed');
      this.config.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Toggle local audio mute
   */
  async toggleAudio(): Promise<boolean> {
    if (!this.room) return false;

    const currentlyEnabled = this.room.localParticipant.isMicrophoneEnabled;
    await this.room.localParticipant.setMicrophoneEnabled(!currentlyEnabled);
    return !currentlyEnabled; // Returns new enabled state
  }

  /**
   * Get current mute state
   */
  isMuted(): boolean {
    if (!this.room) return true;
    return !this.room.localParticipant.isMicrophoneEnabled;
  }

  /**
   * Get current connection state
   */
  getState(): WebRTCState {
    return this.state;
  }

  /**
   * Cleanup all resources
   */
  async destroy(): Promise<void> {
    this.isDestroyed = true;

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }

    this.setState('closed');
    console.log('[LiveKit] Destroyed');
  }

  // --- Private methods ---

  private setState(state: WebRTCState): void {
    if (this.state === state) return;
    this.state = state;
    this.config.onStateChange(state);
  }

  private setupRoomEvents(): void {
    if (!this.room) return;

    // Connection state changes
    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      if (this.isDestroyed) return;

      switch (state) {
        case ConnectionState.Connected:
          this.setState('connected');
          this.startStatsCollection();
          break;
        case ConnectionState.Reconnecting:
          this.setState('reconnecting');
          break;
        case ConnectionState.Disconnected:
          this.stopStatsCollection();
          if (!this.isDestroyed) {
            this.setState('closed');
          }
          break;
      }
    });

    // Remote track subscribed (when advisor's audio arrives)
    this.room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
        if (this.isDestroyed) return;

        if (track.kind === Track.Kind.Audio || track.kind === Track.Kind.Video) {
          const mediaStream = new MediaStream([track.mediaStreamTrack]);
          this.config.onRemoteTrack(track.mediaStreamTrack, mediaStream);
          console.log(`[LiveKit] Remote ${track.kind} track subscribed`);
        }
      }
    );

    // Handle disconnection
    this.room.on(RoomEvent.Disconnected, (reason?: string) => {
      if (this.isDestroyed) return;
      console.log('[LiveKit] Disconnected:', reason);
      this.stopStatsCollection();
      this.setState('closed');
    });

    // Connection quality changes
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality: LKConnectionQuality, participant) => {
      if (this.isDestroyed) return;
      // Log quality changes for remote participants
      if (participant !== this.room?.localParticipant) {
        console.log(`[LiveKit] Remote participant quality: ${LKConnectionQuality[quality]}`);
      }
    });
  }

  private async fetchLiveKitToken(): Promise<LiveKitTokenResponse> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active auth session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/generate-livekit-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: this.config.sessionId }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`LiveKit token failed: ${error.error || response.statusText}`);
    }

    return await response.json();
  }

  private startStatsCollection(): void {
    this.statsInterval = setInterval(() => {
      this.collectStats();
    }, 5000);
  }

  private stopStatsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private async collectStats(): Promise<void> {
    if (!this.room || this.isDestroyed) return;

    try {
      // Get local participant's connection quality from LiveKit
      const localQuality = this.room.localParticipant.connectionQuality;
      const connectionQuality = this.mapLiveKitQuality(localQuality);

      // Collect stats from local audio track
      let bytesReceived = 0;
      let bytesSent = 0;
      let packetsLost = 0;
      let packetsReceived = 0;
      let jitter = 0;
      let roundTripTime = 0;

      // Get sender stats from local publications
      const localPubs = this.room.localParticipant.audioTrackPublications;
      for (const [, pub] of localPubs) {
        if (pub.track) {
          const senderStats = await (pub as LocalTrackPublication).track?.getSenderStats?.();
          if (senderStats) {
            bytesSent = senderStats.bytesSent ?? 0;
            roundTripTime = (senderStats.roundTripTime ?? 0) * 1000;
            jitter = (senderStats.jitter ?? 0) * 1000;
          }
        }
      }

      // Get receiver stats from remote participants
      for (const [, participant] of this.room.remoteParticipants) {
        for (const [, pub] of participant.audioTrackPublications) {
          if (pub.track) {
            const receiverStats = await pub.track?.getReceiverStats?.();
            if (receiverStats) {
              bytesReceived = receiverStats.bytesReceived ?? 0;
              packetsLost = receiverStats.packetsLost ?? 0;
              packetsReceived = receiverStats.packetsReceived ?? 0;
              jitter = receiverStats.jitter
                ? receiverStats.jitter * 1000
                : jitter;
            }
          }
        }
      }

      const webrtcStats: WebRTCStats = {
        timestamp: Date.now(),
        bytesReceived,
        bytesSent,
        packetsLost,
        packetsReceived,
        jitter: Math.round(jitter),
        roundTripTime: Math.round(roundTripTime),
        connectionQuality,
      };

      this.config.onStats(webrtcStats);
    } catch (error) {
      console.warn('[LiveKit] Stats collection error:', error);
    }
  }

  private mapLiveKitQuality(quality: LKConnectionQuality): ConnectionQuality {
    switch (quality) {
      case LKConnectionQuality.Excellent:
        return 'excellent';
      case LKConnectionQuality.Good:
        return 'good';
      case LKConnectionQuality.Poor:
        return 'poor';
      case LKConnectionQuality.Lost:
        return 'lost';
      default:
        return 'good';
    }
  }
}
