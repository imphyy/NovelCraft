import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, chaptersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { RewriteModal } from '../components/RewriteModal';

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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {project?.name}
          </h1>
          <button
            onClick={() => navigate(`/projects/${projectId}/wiki`)}
            className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded"
          >
            📚 Wiki
          </button>
        </div>
        <div className="flex items-center gap-4">
          {saving && <span className="text-sm text-gray-500">Saving...</span>}
          {!saving && selectedChapter && (
            <span className="text-sm text-gray-500">
              {selectedChapter.wordCount} words
            </span>
          )}
          {selectedChapter && (
            <button
              onClick={handleOpenRewrite}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded"
            >
              ✨ AI Rewrite
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Chapters</h2>
              <button
                onClick={() => setShowNewChapter(true)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                + New
              </button>
            </div>

            {showNewChapter && (
              <form onSubmit={handleCreateChapter} className="mb-4">
                {error && (
                  <div className="text-xs text-red-600 mb-2">{error}</div>
                )}
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Chapter title"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
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
                    className="flex-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {chapters.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No chapters yet
              </p>
            ) : (
              <div className="space-y-1">
                {chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapter(chapter)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      selectedChapter?.id === chapter.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium truncate">{chapter.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {chapter.wordCount} words
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-hidden">
          {selectedChapter ? (
            <div className="h-full flex flex-col">
              <div className="bg-white border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedChapter.title}
                </h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full px-6 py-4 text-gray-900 resize-none focus:outline-none"
                  placeholder="Start writing..."
                  style={{ fontSize: '16px', lineHeight: '1.6' }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a chapter or create a new one to start writing
            </div>
          )}
        </main>
      </div>

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
    </div>
  );
}
