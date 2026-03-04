import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'cloned';

const SCRIPT_TEXT =
  "Welcome to your spiritual reading session. I'm here to guide you through the mysteries of the universe and help you find clarity on your path. The cards reveal that a period of growth and transformation is approaching. Trust in the process, and know that the universe has wonderful things in store for you. Let us explore what the stars and spirits have to share about your journey ahead.";

const MIN_RECORDING_SECONDS = 30;
const MAX_RECORDING_SECONDS = 120;

export default function VoiceRecordingCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────────────────
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cartesiaVoiceId, setCartesiaVoiceId] = useState<string | null>(null);

  // ── Refs ────────────────────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Fetch existing voice clone status on mount ─────────────────────
  const fetchVoiceStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('advisor_details')
        .select('cartesia_voice_id')
        .eq('id', user.id)
        .single();

      if (!error && data?.cartesia_voice_id) {
        setCartesiaVoiceId(data.cartesia_voice_id);
        setRecordingState('cloned');
      }
    } catch (err) {
      console.error('[VoiceRecordingCard] Fetch error:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVoiceStatus();
  }, [fetchVoiceStatus]);

  // ── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Stop any active recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop all tracks on the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Revoke object URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // ── Format seconds as mm:ss ────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Start Recording ────────────────────────────────────────────────
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);

        // Revoke previous URL if any
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('recorded');

        // Stop stream tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            // Auto-stop at max
            handleStopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('[VoiceRecordingCard] Microphone access error:', err);
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to record your voice sample.',
        variant: 'destructive',
      });
    }
  };

  // ── Stop Recording ─────────────────────────────────────────────────
  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // ── Playback toggle ────────────────────────────────────────────────
  const handleTogglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // ── Handle audio ended ─────────────────────────────────────────────
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // ── Submit voice sample ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!audioBlob || !user?.id) return;

    setRecordingState('uploading');

    try {
      const filePath = `${user.id}/voice-sample.webm`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('training_docs')
        .upload(filePath, audioBlob, { upsert: true, contentType: 'audio/webm' });

      if (uploadError) throw uploadError;

      // Call clone-voice edge function
      const { error: cloneError } = await supabase.functions.invoke('clone-voice', {
        body: {
          advisor_id: user.id,
          audio_file_path: filePath,
        },
      });

      if (cloneError) throw cloneError;

      setRecordingState('cloned');
      toast({
        title: 'Voice cloned successfully',
        description: 'Your voice sample has been processed. Your Twin AI will now use your voice.',
      });

      // Refresh to get the new cartesia_voice_id
      await fetchVoiceStatus();
    } catch (err: any) {
      console.error('[VoiceRecordingCard] Submit error:', err);
      setRecordingState('recorded');
      toast({
        title: 'Voice cloning failed',
        description: err.message || 'Could not process your voice sample. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // ── Re-record ──────────────────────────────────────────────────────
  const handleReRecord = () => {
    // Clean up previous audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setRecordingState('idle');
  };

  // ── Status badge ───────────────────────────────────────────────────
  const renderStatusBadge = () => {
    switch (recordingState) {
      case 'recording':
        return (
          <Badge
            variant="outline"
            className="border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10"
          >
            Recording
          </Badge>
        );
      case 'cloned':
        return (
          <Badge
            variant="outline"
            className="border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"
          >
            Voice Cloned
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Not Set
          </Badge>
        );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ borderRadius: "18.5px", background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(6,182,212,0.12) 100%)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(139,92,246,0.12)", flexShrink: 0 }}>
            <Mic size={18} style={{ color: "rgba(139,92,246,0.9)" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>Voice Clone</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>Record your voice for AI sessions</p>
          </div>
        </div>
        <div>
          {recordingState === 'recording' && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(239,68,68,0.9)", boxShadow: "0 0 7px rgba(239,68,68,0.8)", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(239,68,68,0.9)", letterSpacing: "0.06em", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>RECORDING</span>
            </div>
          )}
          {recordingState === 'cloned' && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(34,197,94,0.9)", boxShadow: "0 0 7px rgba(34,197,94,0.8)" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(34,197,94,0.9)", letterSpacing: "0.06em", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>CLONED</span>
            </div>
          )}
          {recordingState !== 'recording' && recordingState !== 'cloned' && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>NOT SET</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6" style={{ padding: "20px 24px 24px" }}>
        {/* ── Cloned State ──────────────────────────────────────── */}
        {recordingState === 'cloned' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Voice sample processed</p>
                <p className="text-xs text-muted-foreground">
                  Your Twin AI will use your cloned voice for voice sessions.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReRecord}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Re-record Voice Sample
            </Button>
          </div>
        )}

        {/* ── Idle State — Show script and record button ────────── */}
        {recordingState === 'idle' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Please read the following passage naturally in your normal speaking voice, as if you
                were speaking to a client:
              </Label>
              <div className="rounded-lg border border-border bg-secondary/10 p-4">
                <p className="text-sm text-foreground italic leading-relaxed">
                  "{SCRIPT_TEXT}"
                </p>
              </div>
            </div>

            <Button onClick={handleStartRecording} className="gap-2">
              <Mic className="w-4 h-4" />
              Start Recording
            </Button>
          </div>
        )}

        {/* ── Recording State ──────────────────────────────────── */}
        {recordingState === 'recording' && (
          <div className="space-y-4">
            {/* Script reference */}
            <div className="rounded-lg border border-border bg-secondary/10 p-4">
              <p className="text-sm text-foreground italic leading-relaxed">
                "{SCRIPT_TEXT}"
              </p>
            </div>

            {/* Recording indicator + timer */}
            <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
                <span className="text-sm font-medium text-foreground">Recording...</span>
              </div>
              <span className="font-mono text-lg tabular-nums text-foreground">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* Progress info */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {recordingTime < MIN_RECORDING_SECONDS
                  ? `Minimum ${MIN_RECORDING_SECONDS - recordingTime}s remaining`
                  : 'Minimum reached — you can stop anytime'}
              </span>
              <span>Max {formatTime(MAX_RECORDING_SECONDS)}</span>
            </div>

            {/* Stop button */}
            <Button
              variant="destructive"
              onClick={handleStopRecording}
              disabled={recordingTime < MIN_RECORDING_SECONDS}
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </Button>
          </div>
        )}

        {/* ── Recorded State — Playback + Submit ───────────────── */}
        {recordingState === 'recorded' && (
          <div className="space-y-4">
            {/* Playback */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Preview your recording</Label>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/10 p-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleTogglePlayback}
                  className="h-10 w-10 flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    controls
                    className="flex-1 h-10"
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Duration: {formatTime(recordingTime)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSubmit} className="gap-2">
                <Upload className="w-4 h-4" />
                Submit Voice Sample
              </Button>
              <Button variant="outline" onClick={handleReRecord} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Re-record
              </Button>
            </div>
          </div>
        )}

        {/* ── Uploading State ──────────────────────────────────── */}
        {recordingState === 'uploading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Processing your voice sample...</p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take a minute. Please don't close this page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
