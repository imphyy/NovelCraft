import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X } from 'lucide-react';
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Rewrite</DialogTitle>
          <DialogDescription>
            Select a tool to improve your selected text
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tool Selection */}
          <div className="space-y-2">
            <Label>Tool</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {REWRITE_TOOLS.map((tool) => (
                <Button
                  key={tool.id}
                  variant={selectedTool === tool.id ? 'default' : 'outline'}
                  className="justify-start h-auto py-3"
                  onClick={() => setSelectedTool(tool.id)}
                  disabled={loading || !!response}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span>{tool.icon}</span>
                      <span className="font-medium">{tool.label}</span>
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
            <div className="space-y-2">
              <Label htmlFor="instruction">
                Instruction (optional)
              </Label>
              <Textarea
                id="instruction"
                placeholder="e.g., Make it more suspenseful, Use a darker tone"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                rows={2}
                disabled={loading}
              />
            </div>
          )}

          {/* Original Text */}
          <div className="space-y-2">
            <Label>Original Text</Label>
            <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rewritten Text</Label>
                <div className="p-3 bg-primary/5 border-2 border-primary rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {response.rewrittenText}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tokens: {response.tokensIn} in / {response.tokensOut} out
                </p>
              </div>

              {/* Accept/Reject Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleAccept} className="flex-1">
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
