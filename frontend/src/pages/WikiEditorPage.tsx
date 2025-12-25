import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wikiAPI } from '../api/client';
import type { WikiPage, Backlink, Mention } from '../types/wiki';
import { WIKI_PAGE_TYPES } from '../types/wiki';

export default function WikiEditorPage() {
  const { projectId, pageId } = useParams<{ projectId: string; pageId: string }>();
  const navigate = useNavigate();

  const [page, setPage] = useState<WikiPage | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedContent = useRef('');

  useEffect(() => {
    loadPage();
    loadBacklinks();
    loadMentions();
  }, [pageId]);

  useEffect(() => {
    if (page) {
      setContent(page.content);
      lastSavedContent.current = page.content;
    }
  }, [page?.id]);

  useEffect(() => {
    if (!page) return;
    if (content === lastSavedContent.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePage();
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  const loadPage = async () => {
    try {
      const response = await wikiAPI.get(pageId!);
      setPage(response.data);
    } catch (err) {
      console.error('Failed to load wiki page:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBacklinks = async () => {
    try {
      const response = await wikiAPI.getBacklinks(pageId!);
      setBacklinks(response.data);
    } catch (err) {
      console.error('Failed to load backlinks:', err);
    }
  };

  const loadMentions = async () => {
    try {
      const response = await wikiAPI.getMentions(pageId!);
      setMentions(response.data);
    } catch (err) {
      console.error('Failed to load mentions:', err);
    }
  };

  const savePage = async () => {
    if (!page) return;
    if (content === lastSavedContent.current) return;

    setSaving(true);
    try {
      await wikiAPI.update(page.id, { content });
      lastSavedContent.current = content;
      // Reload backlinks after save (content might have new links)
      loadBacklinks();
    } catch (err) {
      console.error('Failed to save page:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page || !newTag.trim()) return;

    try {
      await wikiAPI.addTag(page.id, newTag.trim());
      setPage({ ...page, tags: [...page.tags, newTag.trim()] });
      setNewTag('');
      setShowTagInput(false);
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!page) return;

    try {
      await wikiAPI.removeTag(page.id, tag);
      setPage({ ...page, tags: page.tags.filter(t => t !== tag) });
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  const handleRebuildLinks = async () => {
    setRebuilding(true);
    try {
      await wikiAPI.rebuildLinks(projectId!);
      loadBacklinks();
      loadMentions();
    } catch (err) {
      console.error('Failed to rebuild links:', err);
    } finally {
      setRebuilding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Page not found</div>
      </div>
    );
  }

  const pageTypeInfo = WIKI_PAGE_TYPES.find(t => t.value === page.pageType);

  return (
    <div className="h-full flex bg-gray-50">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{pageTypeInfo?.icon}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
              <p className="text-sm text-gray-500">{pageTypeInfo?.label}</p>
            </div>
            {saving && <span className="text-sm text-gray-500">Saving...</span>}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 items-center">
            {page.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
            {showTagInput ? (
              <form onSubmit={handleAddTag} className="inline-flex gap-1">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Tag name"
                  className="px-2 py-1 text-sm border border-gray-300 rounded w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button type="submit" className="px-2 py-1 text-sm text-indigo-600 hover:text-indigo-700">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTagInput(false);
                    setNewTag('');
                  }}
                  className="px-2 py-1 text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="px-2 py-1 text-sm text-indigo-600 hover:text-indigo-700 border border-dashed border-gray-300 rounded"
              >
                + Add Tag
              </button>
            )}
          </div>
        </div>

        {/* Content Editor */}
        <div className="flex-1 overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full px-6 py-4 text-gray-900 resize-none focus:outline-none"
            placeholder="Write about this page... Use [[Page Title]] to link to other wiki pages or chapters."
            style={{ fontSize: '16px', lineHeight: '1.6' }}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Rebuild Links Button */}
          <div>
            <button
              onClick={handleRebuildLinks}
              disabled={rebuilding}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
            >
              {rebuilding ? 'Rebuilding...' : '🔄 Rebuild Links'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Scan all content for [[wiki links]]
            </p>
          </div>

          {/* Backlinks */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Backlinks ({backlinks.length})
            </h3>
            {backlinks.length === 0 ? (
              <p className="text-sm text-gray-500">No pages link here yet</p>
            ) : (
              <div className="space-y-2">
                {backlinks.map((link, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      if (link.sourceType === 'wiki_page') {
                        navigate(`/projects/${projectId}/wiki/${link.sourceId}`);
                      } else {
                        navigate(`/projects/${projectId}`);
                      }
                    }}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {link.sourceTitle}
                    </div>
                    <div className="text-xs text-gray-500">
                      {link.sourceType === 'wiki_page' ? 'Wiki Page' : 'Chapter'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mentions (Chapters only) */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Mentioned in Chapters ({mentions.length})
            </h3>
            {mentions.length === 0 ? (
              <p className="text-sm text-gray-500">
                Not mentioned in any chapters yet
              </p>
            ) : (
              <div className="space-y-2">
                {mentions.map((mention) => (
                  <div
                    key={mention.chapterId}
                    className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => navigate(`/projects/${projectId}`)}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {mention.chapterTitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
