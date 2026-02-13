import { useState, useEffect, useRef, useCallback } from 'react';
import { WebRTCService } from '@/services/webrtc';
import { supabase } from '@/integrations/supabase/client';
import type { WebRTCState, WebRTCStats, WebRTCConfig } from '@/types/webrtc';
import type { ConnectionQuality } from '@/types/session';

interface UseWebRTCReturn {
  state: WebRTCState;
  remoteStream: MediaStream | null;
  connectionQuality: ConnectionQuality;
  stats: WebRTCStats | null;
  error: string | null;
  toggleAudio: () => Promise<boolean>;
  isMuted: boolean;
}

const STATS_FLUSH_COUNT = 6; // Flush to DB every 6 samples (30s at 5s intervals)

export function useWebRTC(config: WebRTCConfig): UseWebRTCReturn {
  const [state, setState] = useState<WebRTCState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');
  const [stats, setStats] = useState<WebRTCStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const webrtcRef = useRef<WebRTCService | null>(null);
  const statsBufferRef = useRef<WebRTCStats[]>([]);
  const mountedRef = useRef(true);

  // Flush stats buffer to database
  const flushStats = useCallback(async (sessionId: string) => {
    const buffer = statsBufferRef.current;
    if (buffer.length === 0) return;

    const avgLatency = buffer.reduce((sum, s) => sum + s.roundTripTime, 0) / buffer.length;
    const avgJitter = buffer.reduce((sum, s) => sum + s.jitter, 0) / buffer.length;
    const totalPacketsLost = buffer[buffer.length - 1].packetsLost;
    const totalPacketsReceived = buffer[buffer.length - 1].packetsReceived;
    const packetLoss = totalPacketsReceived > 0
      ? (totalPacketsLost / (totalPacketsLost + totalPacketsReceived)) * 100
      : 0;

    const metadata = {
      avgLatency: Math.round(avgLatency),
      avgJitter: Math.round(avgJitter),
      packetLoss: Math.round(packetLoss * 100) / 100,
      lastUpdated: new Date().toISOString(),
      samplesCollected: buffer.length,
      provider: 'livekit',
    };

    try {
      await supabase
        .from('sessions')
        .update({ session_metadata: metadata })
        .eq('id', sessionId);
    } catch (err) {
      console.warn('[useWebRTC] Failed to flush stats:', err);
    }

    statsBufferRef.current = [];
  }, []);

  // Toggle audio mute
  const toggleAudio = useCallback(async (): Promise<boolean> => {
    if (!webrtcRef.current) return false;
    const enabled = await webrtcRef.current.toggleAudio();
    setIsMuted(!enabled);
    return enabled;
  }, []);

  // Main effect: initialize LiveKit when enabled
  useEffect(() => {
    if (!config.enabled || !config.sessionId) return;

    mountedRef.current = true;
    setError(null);

    // Create WebRTC service (now uses LiveKit internally)
    const webrtc = new WebRTCService({
      sessionId: config.sessionId,
      sessionType: config.sessionType,
      onStateChange: (newState) => {
        if (!mountedRef.current) return;
        setState(newState);
        config.onConnectionStateChange?.(newState);
      },
      onRemoteTrack: (_track, stream) => {
        if (!mountedRef.current) return;
        setRemoteStream(stream);
      },
      onStats: (newStats) => {
        if (!mountedRef.current) return;
        setStats(newStats);
        setConnectionQuality(newStats.connectionQuality);
        config.onStats?.(newStats);

        // Buffer stats and flush periodically
        statsBufferRef.current.push(newStats);
        if (statsBufferRef.current.length >= STATS_FLUSH_COUNT) {
          flushStats(config.sessionId);
        }
      },
      onError: (err) => {
        if (!mountedRef.current) return;
        console.error('[useWebRTC] Error:', err.message);
        setError(err.message);
      },
    });
    webrtcRef.current = webrtc;

    // Initialize LiveKit connection
    webrtc.initialize();

    // Cleanup on unmount or config change
    return () => {
      mountedRef.current = false;

      // Flush remaining stats
      if (statsBufferRef.current.length > 0) {
        flushStats(config.sessionId);
      }

      webrtc.destroy();
      webrtcRef.current = null;
    };
  }, [config.enabled, config.sessionId]); // Only reinitialize on these key changes

  return {
    state,
    remoteStream,
    connectionQuality,
    stats,
    error,
    toggleAudio,
    isMuted,
  };
}
