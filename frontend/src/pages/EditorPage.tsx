import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, chaptersAPI } from '../api/client';
import { RewriteModal } from '../components/RewriteModal';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/scaffolding/EmptyState';
import { Book } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  status: string;
  sortOrder: number;
  wordCount: number;
}

export default function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [error, setError] = useState('');
  const [showRewriteModal, setShowRewriteModal] = useState(false);
  const [selectedText] = useState('');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedContent = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadProjectAndChapters();
  }, [projectId]);

  useEffect(() => {
    if (selectedChapter) {
      setContent(selectedChapter.content);
      lastSavedContent.current = selectedChapter.content;
    }
  }, [selectedChapter?.id]);

  useEffect(() => {
    // Autosave logic
    if (!selectedChapter) return;
    if (content === lastSavedContent.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveChapter();
    }, 1000); // Autosave after 1 second of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  const loadProjectAndChapters = async () => {
    try {
      const [projectRes, chaptersRes] = await Promise.all([
        projectsAPI.get(projectId!),
        chaptersAPI.list(projectId!),
      ]);
      setProject(projectRes.data);
      setChapters(chaptersRes.data);
      if (chaptersRes.data.length > 0) {
        setSelectedChapter(chaptersRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const saveChapter = async () => {
    if (!selectedChapter) return;
    if (content === lastSavedContent.current) return;

    setSaving(true);
    try {
      const response = await chaptersAPI.update(selectedChapter.id, { content });
      lastSavedContent.current = content;

      // Update word count in sidebar
      setChapters(chapters.map(ch =>
        ch.id === selectedChapter.id
          ? { ...ch, wordCount: response.data.wordCount }
          : ch
      ));
      setSelectedChapter({ ...selectedChapter, wordCount: response.data.wordCount });
    } catch (err) {
      console.error('Failed to save chapter:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await chaptersAPI.create(projectId!, newChapterTitle);
      const newChapter = response.data;
      setChapters([...chapters, newChapter]);
      setSelectedChapter(newChapter);
      setShowNewChapter(false);
      setNewChapterTitle('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create chapter');
    }
  };

  const handleAcceptRewrite = (newText: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    const newContent = content.substring(0, start) + newText + content.substring(end);
    setContent(newContent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const leftContext = (
    <div className="flex flex-col h-full font-sans">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
          <Book className="h-3 w-3" />
          Chapters
        </h2>
        <button
          onClick={() => setShowNewChapter(true)}
          className="text-[10px] text-primary/60 hover:text-primary transition-colors uppercase tracking-widest font-semibold"
        >
          + New
        </button>
      </div>

      {showNewChapter && (
        <form
          onSubmit={handleCreateChapter}
          className="mb-6 p-3 bg-muted/10 rounded border border-border/10"
        >
          {error && (
            <div className="text-[10px] text-destructive mb-2">{error}</div>
          )}
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="Chapter title"
            className="w-full px-2 py-1.5 text-xs border border-border/10 rounded mb-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-2 py-1 text-[10px] bg-primary/80 text-primary-foreground rounded hover:opacity-90 transition-opacity uppercase tracking-widest font-semibold"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewChapter(false);
                setNewChapterTitle('');
                setError('');
              }}
              className="flex-1 px-2 py-1 text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors uppercase tracking-widest font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {chapters.length === 0 ? (
        <div className="py-8 px-2">
          <p className="text-[10px] text-muted-foreground/40 text-center italic uppercase tracking-widest mb-4">
            No chapters yet
          </p>
          <div className="space-y-2 text-[10px] text-muted-foreground/50 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="opacity-60">•</span>
              <span>Start with a chapter title that captures your opening scene</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="opacity-60">•</span>
              <span>Build your world in the wiki first if you need structure</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="opacity-60">•</span>
              <span>Use the AI assistant to brainstorm ideas</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded text-xs transition-all",
                selectedChapter?.id === chapter.id
                  ? "bg-muted/40 text-foreground font-medium border-l-2 border-primary/40 pl-2.5"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"
              )}
            >
              <div className="font-medium truncate">{chapter.title}</div>
              <div className="text-[9px] opacity-50 mt-1 uppercase tracking-widest">
                {chapter.wordCount} words
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <AppShell
        title={project?.name}
        leftContext={leftContext}
        main={
          selectedChapter ? (
            <div className="h-full flex flex-col">
              <div className="border-b border-border/10 pb-6 mb-10 flex items-baseline justify-between">
                <h2 className="text-3xl font-semibold text-foreground font-serif tracking-tight">
                  {selectedChapter.title}
                </h2>
                <div className="flex items-center gap-4">
                  {saving && <span className="text-[10px] text-muted-foreground/40 animate-pulse italic">Saving...</span>}
                  <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em]">{selectedChapter.wordCount} words</span>
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[65vh] text-foreground resize-none focus:outline-none bg-transparent font-serif leading-relaxed text-lg md:text-xl placeholder:text-muted-foreground/20 selection:bg-primary/10"
                  placeholder="Once upon a time..."
                />
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Book className="h-16 w-16" />}
              title="Ready to write?"
              description="Select a chapter from the sidebar to begin writing, or create your first chapter to start your manuscript."
              primaryAction={{
                label: 'Create First Chapter',
                onClick: () => setShowNewChapter(true),
              }}
              secondaryAction={{
                label: 'Open Wiki',
                onClick: () => navigate(`/projects/${projectId}/wiki`),
              }}
              steps={[
                {
                  number: 1,
                  title: 'Create a chapter to begin your manuscript',
                },
                {
                  number: 2,
                  title: 'Document characters and lore in the wiki',
                },
                {
                  number: 3,
                  title: 'Ask the AI assistant for help with plot or consistency',
                },
              ]}
            />
          )
        }
      />
      {/* Rewrite Modal */}
      {selectedChapter && (
        <RewriteModal
          open={showRewriteModal}
          onOpenChange={setShowRewriteModal}
          chapterId={selectedChapter.id}
          selectedText={selectedText}
          onAccept={handleAcceptRewrite}
        />
      )}
    </>
  );
}
