import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, chaptersAPI } from '../api/client';
import { RewriteModal } from '../components/RewriteModal';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/scaffolding/EmptyState';
import { Book, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal, ModalHeader, ModalFooter, ModalCancelButton } from '@/components/ui/modal';
import { FormField, FormInput, FormError } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';

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
  const [selectedText, setSelectedText] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedContent = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isUndoRedoRef = useRef(false);

  useEffect(() => {
    loadProjectAndChapters();
  }, [projectId]);

  useEffect(() => {
    if (selectedChapter) {
      setContent(selectedChapter.content);
      setTitleValue(selectedChapter.title);
      lastSavedContent.current = selectedChapter.content;
      // Initialize history with current content
      setHistory([selectedChapter.content]);
      setHistoryIndex(0);
    }
  }, [selectedChapter?.id]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

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
      setChapters(chaptersRes.data || []);
      if (chaptersRes.data && chaptersRes.data.length > 0) {
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

  const handleTextSelection = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = content.substring(start, end);

    setSelectedText(text);
  };

  const handleRewrite = (tool: string) => {
    if (!selectedText || !selectedChapter) return;
    setSelectedTool(tool);
    setShowRewriteModal(true);
  };

  const handleAcceptRewrite = (newText: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    const newContent = content.substring(0, start) + newText + content.substring(end);
    updateContentWithHistory(newContent);
    setSelectedText('');
  };

  const updateContentWithHistory = (newContent: string) => {
    if (isUndoRedoRef.current) {
      // Don't add to history during undo/redo operations
      setContent(newContent);
      return;
    }

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newContent);

    // Limit history to last 100 states
    if (newHistory.length > 100) {
      newHistory.shift();
      setHistoryIndex(99);
    } else {
      setHistoryIndex(newHistory.length - 1);
    }

    setHistory(newHistory);
    setContent(newContent);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setContent(history[newIndex]);
      setTimeout(() => {
        isUndoRedoRef.current = false;
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
    }
  };

  const handleTitleSave = async () => {
    if (!selectedChapter || titleValue === selectedChapter.title) {
      setEditingTitle(false);
      return;
    }

    try {
      await chaptersAPI.update(selectedChapter.id, { title: titleValue });
      setChapters(chapters.map(ch =>
        ch.id === selectedChapter.id ? { ...ch, title: titleValue } : ch
      ));
      setSelectedChapter({ ...selectedChapter, title: titleValue });
      setEditingTitle(false);
    } catch (err) {
      console.error('Failed to update title:', err);
      setTitleValue(selectedChapter.title);
      setEditingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleValue(selectedChapter?.title || '');
      setEditingTitle(false);
    }
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
        projectId={projectId}
        selectedText={selectedText}
        onRewrite={handleRewrite}
        leftContext={leftContext}
        main={
          selectedChapter ? (
            <div className="h-full flex flex-col">
              <div className={cn(
                "border-b pb-6 mb-10 flex items-baseline justify-between transition-all",
                isEditing ? "border-border/20" : "border-border/10"
              )}>
                <div className="flex items-center gap-3 flex-1">
                  {editingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={titleValue}
                      onChange={(e) => setTitleValue(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      className="text-3xl font-medium text-foreground font-serif tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                    />
                  ) : (
                    <h2
                      onClick={() => setEditingTitle(true)}
                      className="text-3xl font-medium text-foreground font-serif tracking-tight cursor-text hover:opacity-80 transition-opacity"
                    >
                      {selectedChapter.title}
                    </h2>
                  )}
                  {isEditing && !editingTitle && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary/50 uppercase tracking-widest font-semibold bg-primary/5 px-2.5 py-1 rounded-sm">
                      <Edit3 className="h-2.5 w-2.5" />
                      <span>Draft</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {saving ? (
                    <span className="text-[10px] text-primary/60 animate-pulse italic">Autosaving...</span>
                  ) : content !== lastSavedContent.current ? (
                    <span className="text-[10px] text-muted-foreground/40 italic">Unsaved</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40 italic">Saved</span>
                  )}
                  <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em]">~{selectedChapter.wordCount.toLocaleString()} words</span>
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => updateContentWithHistory(e.target.value)}
                  onSelect={handleTextSelection}
                  onFocus={() => setIsEditing(true)}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "w-full h-[65vh] text-foreground resize-none focus:outline-none bg-transparent font-serif text-lg md:text-xl placeholder:text-muted-foreground/20 selection:bg-primary/10 transition-all caret-primary",
                    isEditing ? "leading-[1.75]" : "leading-relaxed"
                  )}
                  style={{
                    caretColor: 'hsl(var(--primary))',
                  }}
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

      {/* Create Chapter Modal */}
      <Modal open={showNewChapter} onOpenChange={setShowNewChapter}>
        <ModalHeader
          title="New Chapter"
          description="Add a new chapter to your manuscript."
        />
        <form onSubmit={handleCreateChapter}>
          {error && <FormError>{error}</FormError>}
          <div className="space-y-8">
            <FormField label="Chapter Title" htmlFor="chapterTitle">
              <FormInput
                id="chapterTitle"
                type="text"
                required
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Chapter 1: The Beginning"
                serif
              />
            </FormField>
          </div>
          <ModalFooter>
            <ModalCancelButton
              onClick={() => {
                setShowNewChapter(false);
                setNewChapterTitle('');
                setError('');
              }}
            />
            <Button
              type="submit"
              className="rounded-none px-10 h-11 text-xs font-semibold uppercase tracking-widest"
            >
              Create Chapter
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  );
}
