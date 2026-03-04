import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Bot,
  Upload,
  Trash2,
  FileText,
  Loader2,
  Save,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface KnowledgeDoc {
  filename: string;
  chunks: number;
}

export default function TwinSetupCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────
  const [twinEnabled, setTwinEnabled] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [textRate, setTextRate] = useState('0.50');
  const [voiceRate, setVoiceRate] = useState('2.00');
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Saved values for discard
  const savedRef = useRef({
    systemPrompt: '',
    textRate: '0.50',
    voiceRate: '2.00',
  });

  // ── Fetch on mount ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      // Fetch advisor twin settings
      const { data: details, error: detailsError } = await supabase
        .from('advisor_details')
        .select('twin_enabled, system_prompt, twin_text_rate_per_msg, twin_voice_rate_per_min')
        .eq('id', user.id)
        .single();

      if (!detailsError && details) {
        setTwinEnabled(details.twin_enabled ?? false);
        setSystemPrompt(details.system_prompt ?? '');
        setTextRate(details.twin_text_rate_per_msg?.toString() ?? '0.50');
        setVoiceRate(details.twin_voice_rate_per_min?.toString() ?? '2.00');
        savedRef.current = {
          systemPrompt: details.system_prompt ?? '',
          textRate: details.twin_text_rate_per_msg?.toString() ?? '0.50',
          voiceRate: details.twin_voice_rate_per_min?.toString() ?? '2.00',
        };
      }

      // Fetch knowledge base documents grouped by source_filename
      const { data: docs, error: docsError } = await supabase
        .rpc('get_knowledge_doc_counts', { p_advisor_id: user.id });

      if (!docsError && docs) {
        setDocuments(
          docs.map((d: { source_filename: string; chunks: number }) => ({
            filename: d.source_filename,
            chunks: d.chunks,
          }))
        );
      } else {
        // Fallback: direct query if RPC doesn't exist
        const { data: rawDocs } = await supabase
          .from('knowledge_base_documents')
          .select('source_filename')
          .eq('advisor_id', user.id);

        if (rawDocs) {
          const grouped: Record<string, number> = {};
          rawDocs.forEach((row: { source_filename: string }) => {
            grouped[row.source_filename] = (grouped[row.source_filename] || 0) + 1;
          });
          setDocuments(
            Object.entries(grouped).map(([filename, chunks]) => ({ filename, chunks }))
          );
        }
      }
    } catch (err) {
      console.error('[TwinSetupCard] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Toggle twin_enabled (saves immediately like status toggle) ─────
  const handleToggleEnabled = async (checked: boolean) => {
    setTwinEnabled(checked);
    if (!user?.id) return;

    const { error } = await supabase
      .from('advisor_details')
      .update({ twin_enabled: checked, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('[TwinSetupCard] Toggle error:', error);
      setTwinEnabled(!checked); // Revert on failure
      toast({
        title: 'Error',
        description: 'Failed to update Twin AI status.',
        variant: 'destructive',
      });
    }
  };

  // ── Track changes for save/discard ─────────────────────────────────
  const handleSystemPromptChange = (value: string) => {
    setSystemPrompt(value);
    setHasChanges(true);
  };

  const handleTextRateChange = (value: string) => {
    setTextRate(value);
    setHasChanges(true);
  };

  const handleVoiceRateChange = (value: string) => {
    setVoiceRate(value);
    setHasChanges(true);
  };

  // ── Save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('advisor_details')
      .update({
        twin_enabled: twinEnabled,
        system_prompt: systemPrompt,
        twin_text_rate_per_msg: parseFloat(textRate) || 0.5,
        twin_voice_rate_per_min: parseFloat(voiceRate) || 2.0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setIsSaving(false);

    if (error) {
      console.error('[TwinSetupCard] Save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Twin AI settings.',
        variant: 'destructive',
      });
      return;
    }

    savedRef.current = { systemPrompt, textRate, voiceRate };
    setHasChanges(false);
    toast({
      title: 'Saved',
      description: 'Twin AI settings updated successfully.',
    });
  };

  // ── Discard ────────────────────────────────────────────────────────
  const handleDiscard = () => {
    setSystemPrompt(savedRef.current.systemPrompt);
    setTextRate(savedRef.current.textRate);
    setVoiceRate(savedRef.current.voiceRate);
    setHasChanges(false);
  };

  // ── File upload ────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);

    try {
      const filePath = `${user.id}/${file.name}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('training_docs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Call ingest-knowledge edge function
      const { error: ingestError } = await supabase.functions.invoke('ingest-knowledge', {
        body: {
          advisor_id: user.id,
          file_path: filePath,
          filename: file.name,
        },
      });

      if (ingestError) throw ingestError;

      toast({
        title: 'Upload complete',
        description: `"${file.name}" has been processed and added to your knowledge base.`,
      });

      // Refresh document list
      await fetchData();
    } catch (err: any) {
      console.error('[TwinSetupCard] Upload error:', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'Could not upload the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input so the same file can be re-selected
      e.target.value = '';
    }
  };

  // ── Delete document ────────────────────────────────────────────────
  const handleDeleteDocument = async (filename: string) => {
    if (!user?.id) return;

    try {
      // Remove chunks from knowledge_base_documents
      const { error: deleteError } = await supabase
        .from('knowledge_base_documents')
        .delete()
        .eq('advisor_id', user.id)
        .eq('source_filename', filename);

      if (deleteError) throw deleteError;

      // Remove file from storage
      const filePath = `${user.id}/${filename}`;
      await supabase.storage.from('training_docs').remove([filePath]);

      setDocuments((prev) => prev.filter((d) => d.filename !== filename));

      toast({
        title: 'Deleted',
        description: `"${filename}" has been removed from your knowledge base.`,
      });
    } catch (err: any) {
      console.error('[TwinSetupCard] Delete error:', err);
      toast({
        title: 'Delete failed',
        description: err.message || 'Could not delete the document.',
        variant: 'destructive',
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ borderRadius: "18.5px", background: "linear-gradient(155deg, #120A2E 0%, #0C0418 55%, #09061A 100%)", backdropFilter: "blur(24px)", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(6,182,212,0.12) 100%)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(139,92,246,0.12)", flexShrink: 0 }}>
            <Bot size={18} style={{ color: "rgba(139,92,246,0.9)" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>Twin AI</h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', 'Inter', ui-sans-serif, sans-serif" }}>AI knowledge base &amp; pricing</p>
          </div>
        </div>
        {!isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: twinEnabled ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.04)", border: `1px solid ${twinEnabled ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}` }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: twinEnabled ? "rgba(34,197,94,0.9)" : "rgba(255,255,255,0.3)", boxShadow: twinEnabled ? "0 0 7px rgba(34,197,94,0.8)" : "none" }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: twinEnabled ? "rgba(34,197,94,0.9)" : "rgba(255,255,255,0.4)", letterSpacing: "0.06em", fontFamily: "'SF Mono', 'Fira Code', monospace" }}>{twinEnabled ? "ACTIVE" : "INACTIVE"}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22, padding: "20px 24px 24px" }}>
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
            <Loader2 size={16} className="animate-spin" style={{ color: "#06b6d4" }} />
            Loading Twin AI settings...
          </div>
        ) : (
          <>
            {/* ── Enable / Disable Toggle ────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Enable Twin AI</span>
              <Switch
                id="twin-toggle"
                checked={twinEnabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(139,92,246,0.1)" }} />

            {/* ── System Prompt ───────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>System Prompt</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontFamily: "'SF Mono', monospace" }}>{systemPrompt.length} chars</span>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 12, boxShadow: "0 0 0 1px rgba(139,92,246,0.22)", pointerEvents: "none", zIndex: 1 }} />
                <textarea
                  id="system-prompt"
                  value={systemPrompt}
                  onChange={(e) => handleSystemPromptChange(e.target.value)}
                  placeholder="You are a compassionate spiritual advisor specializing in..."
                  rows={5}
                  style={{ width: "100%", padding: "13px 16px", borderRadius: 12, background: "rgba(9,6,26,0.97)", border: "none", outline: "none", color: "rgba(255,255,255,0.85)", fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontSize: 13, lineHeight: 1.75, resize: "vertical", boxSizing: "border-box", position: "relative", zIndex: 0 }}
                  onFocus={(e) => { (e.currentTarget.parentElement?.querySelector("div") as HTMLElement).style.boxShadow = "0 0 0 1.5px #06b6d4, 0 0 22px rgba(6,182,212,0.09)"; }}
                  onBlur={(e) => { (e.currentTarget.parentElement?.querySelector("div") as HTMLElement).style.boxShadow = "0 0 0 1px rgba(139,92,246,0.22)"; }}
                />
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(139,92,246,0.1)" }} />

            {/* ── AI Pricing ──────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>AI Pricing</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: "text-rate", label: "Credits per message (text)", value: textRate, onChange: handleTextRateChange },
                  { id: "voice-rate", label: "Credits per minute (voice)", value: voiceRate, onChange: handleVoiceRateChange },
                ].map((field) => (
                  <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{field.label}</span>
                    <div style={{ borderRadius: 10, padding: "1.5px", background: "linear-gradient(135deg, rgba(6,182,212,0.28) 0%, rgba(139,92,246,0.15) 100%)", display: "inline-flex" }}>
                      <div style={{ display: "flex", alignItems: "center", width: "100%", borderRadius: 8.5, background: "rgba(12,5,28,0.93)", overflow: "hidden" }}>
                        <input
                          id={field.id}
                          type="number"
                          step="0.01"
                          min="0"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          style={{ flex: 1, padding: "9px 14px", background: "transparent", border: "none", outline: "none", color: "rgba(255,255,255,0.88)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, MozAppearance: "textfield", WebkitAppearance: "none" } as React.CSSProperties}
                        />
                        <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
                          {[
                            { dir: "up", icon: <ChevronUp size={11} />, delta: 0.5 },
                            { dir: "down", icon: <ChevronDown size={11} />, delta: -0.5 },
                          ].map(({ dir, icon, delta }) => (
                            <button
                              key={dir}
                              type="button"
                              tabIndex={-1}
                              onClick={() => {
                                const next = Math.max(0, parseFloat(field.value || "0") + delta);
                                field.onChange(next.toFixed(2));
                              }}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 19, background: "transparent", border: "none", cursor: "pointer", color: "rgba(139,92,246,0.6)", transition: "color 0.15s, background 0.15s", borderBottom: dir === "up" ? "1px solid rgba(255,255,255,0.07)" : "none" }}
                              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#06b6d4"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,182,212,0.08)"; }}
                              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(139,92,246,0.6)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(139,92,246,0.1)" }} />

            {/* ── Knowledge Base ───────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Knowledge Base</span>

              {/* Upload area */}
              <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, border: "1.5px dashed rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.04)", padding: "24px 16px", cursor: isUploading ? "not-allowed" : "pointer", opacity: isUploading ? 0.6 : 1, transition: "all 0.2s ease" }}
                onMouseOver={(e) => { if (!isUploading) { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(6,182,212,0.5)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(6,182,212,0.06)"; } }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.3)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.04)"; }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" style={{ color: "#06b6d4" }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Uploading and processing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={22} style={{ color: "rgba(139,92,246,0.7)" }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                      Click to upload{" "}
                      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>.txt</span>,{" "}
                      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>.md</span>, or{" "}
                      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>.pdf</span>
                    </span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Document list */}
              {documents.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.filename}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 10, border: "1px solid rgba(139,92,246,0.18)", background: "rgba(139,92,246,0.06)", padding: "9px 12px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <FileText size={14} style={{ color: "rgba(139,92,246,0.7)", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.filename}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)", color: "rgba(6,182,212,0.8)", flexShrink: 0, fontFamily: "'SF Mono', monospace" }}>
                          {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.filename)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, flexShrink: 0, color: "rgba(255,255,255,0.3)", transition: "color 0.15s ease" }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,68,68,0.9)"; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)"; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Save / Discard ───────────────────────────────────── */}
            {hasChanges && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 16, marginTop: 4, borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24", display: "inline-block", boxShadow: "0 0 7px rgba(251,191,36,0.9)", flexShrink: 0 }} />
                  Unsaved changes
                </span>
                <button
                  onClick={handleDiscard}
                  disabled={isSaving}
                  style={{ padding: "7px 15px", borderRadius: 9, background: "transparent", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s ease" }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)"; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
                >
                  <X size={11} />
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ padding: "7px 18px", borderRadius: 9, background: "linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(139,92,246,0.18) 100%)", border: "1px solid rgba(6,182,212,0.42)", color: "rgba(6,182,212,0.95)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 0 22px rgba(6,182,212,0.35)", letterSpacing: "0.02em", transition: "all 0.3s ease" }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(6,182,212,0.45)"; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(6,182,212,0.35)"; }}
                >
                  {isSaving ? (
                    <><Loader2 size={12} className="animate-spin" />Saving...</>
                  ) : (
                    <><Save size={12} />Save Changes</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
