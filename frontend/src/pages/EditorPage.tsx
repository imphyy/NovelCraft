import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, chaptersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { RewriteModal } from '../components/RewriteModal';
import { AppShell } from '../components/layout/AppShell';
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
  const { logout } = useAuth();

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
  const [selectedText, setSelectedText] = useState('');

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  const handleOpenRewrite = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = content.substring(start, end);

    if (text.trim()) {
      setSelectedText(text);
      setShowRewriteModal(true);
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Book className="h-3 w-3" />
          Chapters
        </h2>
        <button
          onClick={() => setShowNewChapter(true)}
          className="text-xs text-primary hover:underline font-medium"
        >
          + New
        </button>
      </div>

      {showNewChapter && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateChapter();
          }}
          className="mb-4 p-2 bg-muted/50 rounded-lg border border-border shadow-sm"
        >
          {error && (
            <div className="text-[10px] text-destructive mb-2">{error}</div>
          )}
          <input
            type="text"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="Chapter title"
            className="w-full px-2 py-1.5 text-xs border border-border rounded mb-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-2 py-1 text-[10px] bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
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
              className="flex-1 px-2 py-1 text-[10px] text-muted-foreground hover:bg-background rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {chapters.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8 italic">
          No chapters yet
        </p>
      ) : (
        <div className="space-y-1">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter)}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-xs transition-all",
                selectedChapter?.id === chapter.id
                  ? "bg-accent text-accent-foreground font-medium shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="font-medium truncate">{chapter.title}</div>
              <div className="text-[10px] opacity-70 mt-0.5">
                {chapter.wordCount} words
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AppShell
      title={project?.name}
      leftContext={leftContext}
      main={
        selectedChapter ? (
          <div className="h-full flex flex-col">
            <div className="border-b border-border/50 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-foreground font-serif">
                {selectedChapter.title}
              </h2>
              {saving && <span className="text-[10px] text-muted-foreground animate-pulse ml-2 italic">Saving...</span>}
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[65vh] text-foreground resize-none focus:outline-none bg-transparent font-serif leading-relaxed text-lg md:text-xl placeholder:opacity-30"
                placeholder="Once upon a time..."
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
            <Book className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a chapter or create a new one to start writing</p>
          </div>
        )
      }
    >
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
    </AppShell>
  );
}
