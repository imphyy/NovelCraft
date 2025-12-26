import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { aiAPI } from '@/api/client';
import type { AskResponse } from '@/types/ai';

interface AskAIProps {
  projectId: string;
}

export function AskAI({ projectId }: AskAIProps) {
  const [question, setQuestion] = useState('');
  const [canonSafe, setCanonSafe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await aiAPI.ask(projectId, question, canonSafe);
      setResponse(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get answer. Make sure OpenAI API key is configured.');
    } finally {
      setLoading(false);
    }
  };

  const examplePrompts = [
    "Summarize the protagonist's character arc so far",
    "List all unresolved plot threads in the manuscript",
    "What contradictions exist in the world-building?",
    "Describe the relationships between main characters",
    "What's the timeline of major events?",
  ];

  const handleExampleClick = (prompt: string) => {
    setQuestion(prompt);
  };

  return (
    <div className="space-y-12">
      {!response && !loading && (
        <div className="space-y-6 pb-8 border-b border-border/10">
          <div className="space-y-2">
            <h3 className="text-lg font-serif text-foreground">How can I help?</h3>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Ask questions about your manuscript, check for consistency, or explore your story's themes and structure.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
              Example Prompts
            </p>
            <div className="grid grid-cols-1 gap-2">
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(prompt)}
                  className="text-left px-4 py-3 bg-muted/5 border border-border/20 rounded-sm hover:border-primary/30 hover:bg-muted/10 transition-all group"
                >
                  <p className="text-sm text-foreground/80 group-hover:text-primary transition-colors">
                    "{prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-serif">Ask Your Manuscript</h3>
          <p className="text-sm text-muted-foreground italic">
            Query your chapters and world knowledge for consistency.
          </p>
        </div>

        <div className="space-y-6 pt-4 max-w-2xl">
          <div className="space-y-3">
            <Label htmlFor="question" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Question</Label>
            <Textarea
              id="question"
              placeholder="e.g., What color are Rhea's eyes?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="bg-transparent border-border/40 focus:border-primary transition-colors resize-none font-serif text-lg"
            />
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="canonSafe"
              checked={canonSafe}
              onCheckedChange={(checked) => setCanonSafe(checked as boolean)}
              className="rounded-none border-border/60"
            />
            <Label
              htmlFor="canonSafe"
              className="text-xs text-muted-foreground font-normal cursor-pointer"
            >
              Canon-safe mode (only use existing text, don't invent facts)
            </Label>
          </div>

          <Button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="rounded-none px-8 h-10 text-xs font-semibold uppercase tracking-widest"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Searching...
              </>
            ) : (
              'Query Manuscript'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/5 text-destructive text-xs px-4 py-3 border-l-2 border-destructive max-w-2xl">
          {error}
        </div>
      )}

      {response && (
        <div className="space-y-12 animate-in fade-in duration-500">
          <div className="space-y-4 max-w-3xl">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] border-b border-border/10 pb-2">Response</h4>
            <div className="text-xl font-serif leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {response.answer}
            </div>
            <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest pt-4">
              Metadata: {response.tokensIn} tokens in / {response.tokensOut} tokens out
            </p>
          </div>

          {response.citations.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Source Fragments</h4>
              <div className="space-y-0 border-t border-border/10">
                {response.citations.map((citation, idx) => (
                  <div key={citation.chunkId} className="py-8 border-b border-border/5 group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                        Source {idx + 1} — {citation.sourceType === 'chapter' ? 'Chapter' : 'Wiki Page'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/20 italic">
                        {(citation.similarity * 100).toFixed(1)}% relevance
                      </span>
                    </div>
                    <p className="text-base font-serif text-muted-foreground/80 leading-relaxed max-w-3xl italic">
                      “{citation.content}”
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
