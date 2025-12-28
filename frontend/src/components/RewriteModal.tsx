import { useState } from 'react';
import { Modal, ModalHeader, ModalFooter, ModalCancelButton } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { aiAPI } from '@/api/client';
import { REWRITE_TOOLS, type RewriteTool, type RewriteResponse } from '@/types/ai';

interface RewriteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  selectedText: string;
  onAccept: (newText: string) => void;
}

export function RewriteModal({
  open,
  onOpenChange,
  chapterId,
  selectedText,
  onAccept,
}: RewriteModalProps) {
  const [selectedTool, setSelectedTool] = useState<RewriteTool>('rewrite');
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RewriteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await aiAPI.rewrite(
        chapterId,
        selectedTool,
        selectedText,
        instruction || undefined
      );
      setResponse(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to rewrite. Make sure OpenAI API key is configured.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (response) {
      onAccept(response.rewrittenText);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedTool('rewrite');
    setInstruction('');
    setResponse(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalHeader
        title="AI Rewrite"
        description="Select a tool to improve your selected text"
      />

      <div className="space-y-6">
        {/* Tool Selection */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Choose Tool</p>
          <div className="grid grid-cols-1 gap-2">
            {REWRITE_TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? 'default' : 'outline'}
                className="justify-start h-auto py-3"
                onClick={() => setSelectedTool(tool.id)}
                disabled={loading || !!response}
              >
                <div className="text-left w-full">
                  <div className="flex items-center gap-2">
                    <span>{tool.icon}</span>
                    <span className="font-medium text-sm">{tool.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {tool.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Optional Instruction */}
        {selectedTool === 'rewrite' && !response && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Instruction (optional)</p>
            <Textarea
              id="instruction"
              placeholder="e.g., Make it more suspenseful, Use a darker tone"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={2}
              disabled={loading}
              className="text-sm"
            />
          </div>
        )}

        {/* Original Text */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Original Text</p>
          <div className="p-3 bg-muted/10 border border-border/20 rounded-sm text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
            {selectedText}
          </div>
        </div>

        {/* Action Button */}
        {!response && (
          <Button onClick={handleRewrite} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              'Generate Rewrite'
            )}
          </Button>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Result */}
        {response && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Rewritten Text</p>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-sm text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
              {response.rewrittenText}
            </div>
            <p className="text-xs text-muted-foreground/60">
              Tokens: {response.tokensIn} in / {response.tokensOut} out
            </p>
          </div>
        )}
      </div>

      {response && (
        <ModalFooter>
          <ModalCancelButton onClick={handleClose}>
            Reject
          </ModalCancelButton>
          <Button onClick={handleAccept}>
            Accept
          </Button>
        </ModalFooter>
      )}
    </Modal>
  );
}
