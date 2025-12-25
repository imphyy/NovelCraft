import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, History, RotateCcw } from 'lucide-react';
import { chaptersAPI } from '@/api/client';

interface Revision {
  id: string;
  chapterTitle: string;
  content: string;
  note: string;
  createdAt: string;
}

interface RevisionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  onRestore: (content: string) => void;
}

export function RevisionsModal({
  open,
  onOpenChange,
  chapterId,
  onRestore,
}: RevisionsModalProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (open) {
      loadRevisions();
    }
  }, [open, chapterId]);

  const loadRevisions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await chaptersAPI.listRevisions(chapterId);
      setRevisions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load revisions');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (revisionId: string) => {
    setRestoring(true);
    setError(null);

    try {
      const response = await chaptersAPI.restoreRevision(revisionId);
      onRestore(response.data.content);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to restore revision');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Chapter Revisions
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this chapter
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* Revisions List */}
            <div className="w-1/3 border-r pr-4 overflow-y-auto">
              {revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No revisions yet
                </p>
              ) : (
                <div className="space-y-2">
                  {revisions.map((revision) => (
                    <div
                      key={revision.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRevision?.id === revision.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedRevision(revision)}
                    >
                      <div className="text-sm font-medium">
                        {formatDate(revision.createdAt)}
                      </div>
                      {revision.note && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {revision.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revision Preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedRevision ? (
                <>
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">
                      {selectedRevision.chapterTitle}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedRevision.createdAt)}
                      </p>
                      <Button
                        onClick={() => handleRestore(selectedRevision.id)}
                        disabled={restoring}
                        size="sm"
                      >
                        {restoring ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore This Version
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto border rounded-lg p-4 bg-muted/30">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {selectedRevision.content}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a revision to preview
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
