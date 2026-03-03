import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Bot,
  Upload,
  Trash2,
  FileText,
  Loader2,
  Save,
  X,
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Twin AI
          </CardTitle>
          {!isLoading && (
            <Badge
              variant="outline"
              className={
                twinEnabled
                  ? 'border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10'
                  : 'text-muted-foreground'
              }
            >
              {twinEnabled ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading Twin AI settings...
          </div>
        ) : (
          <>
            {/* ── Enable / Disable Toggle ────────────────────────── */}
            <div className="flex items-center justify-between">
              <Label htmlFor="twin-toggle" className="text-sm font-medium">
                Enable Twin AI
              </Label>
              <Switch
                id="twin-toggle"
                checked={twinEnabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>

            {/* ── System Prompt ───────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt" className="text-sm text-muted-foreground">
                System Prompt
              </Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => handleSystemPromptChange(e.target.value)}
                placeholder="You are a compassionate spiritual advisor specializing in..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground text-right">
                {systemPrompt.length} characters
              </p>
            </div>

            {/* ── AI Pricing ──────────────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">AI Pricing</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="text-rate" className="text-xs text-muted-foreground">
                    Credits per message (text)
                  </Label>
                  <Input
                    id="text-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={textRate}
                    onChange={(e) => handleTextRateChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voice-rate" className="text-xs text-muted-foreground">
                    Credits per minute (voice)
                  </Label>
                  <Input
                    id="voice-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={voiceRate}
                    onChange={(e) => handleVoiceRateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* ── Knowledge Base ───────────────────────────────────── */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Knowledge Base</Label>

              {/* Upload area */}
              <button
                type="button"
                onClick={() => !isUploading && fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors py-6 px-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-sm text-muted-foreground">Uploading and processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload <span className="font-medium text-foreground">.txt</span>,{' '}
                      <span className="font-medium text-foreground">.md</span>, or{' '}
                      <span className="font-medium text-foreground">.pdf</span>
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
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.filename}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/10 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate">{doc.filename}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {doc.chunks} chunk{doc.chunks !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => handleDeleteDocument(doc.filename)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Save / Discard ───────────────────────────────────── */}
            {hasChanges && (
              <div className="flex items-center justify-end gap-2 pt-4 mt-1 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-sans text-muted-foreground hover:text-foreground"
                  onClick={handleDiscard}
                  disabled={isSaving}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs font-sans"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
