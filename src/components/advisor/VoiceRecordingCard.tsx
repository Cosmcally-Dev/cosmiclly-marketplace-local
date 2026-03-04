import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
  const [, setCartesiaVoiceId] = useState<string | null>(null);

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

      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "20px 24px 24px" }}>
        {/* ── Cloned State ──────────────────────────────────────── */}
        {recordingState === 'cloned' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, border: "1px solid rgba(34,197,94,0.22)", background: "rgba(34,197,94,0.06)", padding: 16 }}>
              <CheckCircle2 size={22} style={{ color: "rgba(34,197,94,0.9)", flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Voice sample processed</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Your Twin AI will use your cloned voice for voice sessions.</p>
              </div>
            </div>
            <button
              onClick={handleReRecord}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s ease" }}
              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(6,182,212,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(6,182,212,0.9)"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
            >
              <RotateCcw size={13} />
              Re-record Voice Sample
            </button>
          </div>
        )}

        {/* ── Idle State — Show script and record button ────────── */}
        {recordingState === 'idle' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                Please read the following passage naturally in your normal speaking voice, as if you were speaking to a client:
              </span>
              <div style={{ borderRadius: 12, border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.06)", padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", fontStyle: "italic", lineHeight: 1.75 }}>"{SCRIPT_TEXT}"</p>
              </div>
            </div>
            <button
              onClick={handleStartRecording}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, background: "linear-gradient(135deg, rgba(139,92,246,0.22) 0%, rgba(6,182,212,0.18) 100%)", border: "1px solid rgba(139,92,246,0.45)", color: "rgba(139,92,246,0.95)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 0 18px rgba(139,92,246,0.25)", transition: "all 0.2s ease" }}
              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
            >
              <Mic size={14} />
              Start Recording
            </button>
          </div>
        )}

        {/* ── Recording State ──────────────────────────────────── */}
        {recordingState === 'recording' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Script reference */}
            <div style={{ borderRadius: 12, border: "1px solid rgba(139,92,246,0.2)", background: "rgba(139,92,246,0.06)", padding: 16 }}>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", fontStyle: "italic", lineHeight: 1.75 }}>"{SCRIPT_TEXT}"</p>
            </div>

            {/* Recording indicator + timer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 12, border: "1px solid rgba(239,68,68,0.22)", background: "rgba(239,68,68,0.06)", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ position: "relative", display: "flex", width: 12, height: 12, flexShrink: 0 }}>
                  <span className="animate-ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(239,68,68,0.6)" }} />
                  <span style={{ position: "relative", width: 12, height: 12, borderRadius: "50%", background: "rgba(239,68,68,0.9)", boxShadow: "0 0 8px rgba(239,68,68,0.8)" }} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Recording...</span>
              </div>
              <span style={{ fontFamily: "'SF Mono', monospace", fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "0.05em" }}>{formatTime(recordingTime)}</span>
            </div>

            {/* Progress info */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
              <span>
                {recordingTime < MIN_RECORDING_SECONDS
                  ? `Minimum ${MIN_RECORDING_SECONDS - recordingTime}s remaining`
                  : 'Minimum reached — you can stop anytime'}
              </span>
              <span>Max {formatTime(MAX_RECORDING_SECONDS)}</span>
            </div>

            {/* Stop button */}
            <button
              onClick={handleStopRecording}
              disabled={recordingTime < MIN_RECORDING_SECONDS}
              style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, background: recordingTime < MIN_RECORDING_SECONDS ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)", color: recordingTime < MIN_RECORDING_SECONDS ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.9)", fontSize: 13, fontWeight: 700, cursor: recordingTime < MIN_RECORDING_SECONDS ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s ease" }}
            >
              <Square size={13} />
              Stop Recording
            </button>
          </div>
        )}

        {/* ── Recorded State — Playback + Submit ───────────────── */}
        {recordingState === 'recorded' && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Playback */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Preview your recording</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, border: "1px solid rgba(6,182,212,0.2)", background: "rgba(6,182,212,0.05)", padding: 14 }}>
                <button
                  onClick={handleTogglePlayback}
                  style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "rgba(6,182,212,0.9)", transition: "all 0.15s ease" }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,182,212,0.22)"; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,182,212,0.12)"; }}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={handleAudioEnded}
                    controls
                    style={{ flex: 1, height: 40 }}
                  />
                )}
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Duration: {formatTime(recordingTime)}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleSubmit}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.18) 100%)", border: "1px solid rgba(6,182,212,0.42)", color: "rgba(6,182,212,0.95)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 0 18px rgba(6,182,212,0.3)", transition: "all 0.2s ease" }}
                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; }}
              >
                <Upload size={13} />
                Submit Voice Sample
              </button>
              <button
                onClick={handleReRecord}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s ease" }}
                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; }}
              >
                <RotateCcw size={13} />
                Re-record
              </button>
            </div>
          </div>
        )}

        {/* ── Uploading State ──────────────────────────────────── */}
        {recordingState === 'uploading' && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "32px 0" }}>
            <Loader2 size={30} className="animate-spin" style={{ color: "#06b6d4" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Processing your voice sample...</p>
              <p style={{ margin: "5px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>This may take a minute. Please don't close this page.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
