import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask Your Novel</CardTitle>
        <CardDescription>
          Ask questions about your chapters and wiki using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            placeholder="e.g., What color are Rhea's eyes? Where was the crystal first mentioned?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="canonSafe"
            checked={canonSafe}
            onCheckedChange={(checked) => setCanonSafe(checked as boolean)}
          />
          <Label
            htmlFor="canonSafe"
            className="text-sm font-normal cursor-pointer"
          >
            Canon-safe mode (only use existing text, don't invent facts)
          </Label>
        </div>

        <Button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            'Ask'
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && (
          <div className="space-y-4 mt-6">
            <div className="border-l-4 border-primary pl-4 py-2">
              <h3 className="font-semibold mb-2">Answer</h3>
              <p className="text-sm whitespace-pre-wrap">{response.answer}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Tokens: {response.tokensIn} in / {response.tokensOut} out
              </p>
            </div>

            {response.citations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Sources ({response.citations.length})</h3>
                <div className="space-y-2">
                  {response.citations.map((citation, idx) => (
                    <Card key={citation.chunkId} className="bg-muted/50">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-medium">
                            Source {idx + 1} - {citation.sourceType === 'chapter' ? 'Chapter' : 'Wiki Page'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(citation.similarity * 100).toFixed(1)}% match
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {citation.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
