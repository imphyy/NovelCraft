import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wikiAPI } from '../api/client';
import type { WikiPage, Backlink, Mention } from '../types/wiki';
import { WIKI_PAGE_TYPES } from '../types/wiki';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Link, MessageSquare, Tag, Plus, RefreshCw, Library } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const rightPanel = (
    <div className="flex flex-col h-full bg-card/40">
      <div className="p-4 border-b border-border/50 bg-muted/20">
        <h3 className="text-sm font-bold flex items-center gap-2 text-foreground/80">
          <Link className="h-4 w-4 opacity-70" />
          Connections
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Rebuild Links */}
        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs bg-card/50"
            onClick={handleRebuildLinks}
            disabled={rebuilding}
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", rebuilding && "animate-spin")} />
            {rebuilding ? 'Rebuilding...' : 'Rebuild Links'}
          </Button>
          <p className="text-[10px] text-muted-foreground/60 mt-1 text-center">Scan all content for [[wiki links]]</p>
        </div>

        {/* Backlinks */}
        <div>
          <h4 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3 px-1">Backlinks ({backlinks.length})</h4>
          {backlinks.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 italic px-1">No pages link here yet.</p>
          ) : (
            <div className="space-y-2">
              {backlinks.map((link, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (link.sourceType === 'wiki_page') {
                      navigate(`/projects/${projectId}/wiki/${link.sourceId}`);
                    } else {
                      navigate(`/projects/${projectId}`);
                    }
                  }}
                  className="w-full text-left p-2.5 rounded-md border border-border/40 bg-card/30 hover:bg-muted/40 hover:border-border/60 transition-all group shadow-sm"
                >
                  <div className="text-xs font-medium group-hover:text-primary transition-colors">{link.sourceTitle}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1 capitalize">{link.sourceType.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mentions */}
        <div>
          <h4 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3 px-1">Mentioned in Chapters ({mentions.length})</h4>
          {mentions.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 italic px-1">No mentions found.</p>
          ) : (
            <div className="space-y-2">
              {mentions.map((mention, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md border border-border/40 bg-card/30 hover:bg-muted/40 transition-all cursor-pointer shadow-sm"
                  onClick={() => navigate(`/projects/${projectId}/editor`)}
                >
                  <div className="text-xs font-medium">{mention.chapterTitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
    <AppShell
      title={page.title}
      rightPanel={rightPanel}
      main={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{pageTypeInfo?.icon}</span>
              <div>
                <h1 className="text-3xl font-bold font-serif">{page.title}</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">{pageTypeInfo?.label}</p>
              </div>
            </div>
            {saving && <span className="text-[10px] text-muted-foreground animate-pulse">Saving...</span>}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {page.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-[10px] font-medium text-muted-foreground">
                <Tag className="h-3 w-3" />
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-foreground">×</button>
              </span>
            ))}
            {showTagInput ? (
              <form onSubmit={handleAddTag} className="flex items-center gap-1">
                <input
                  autoFocus
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="px-2 py-1 bg-background border border-border rounded-full text-[10px] focus:outline-none focus:ring-1 focus:ring-primary w-24"
                  placeholder="Tag name..."
                />
              </form>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="flex items-center gap-1 px-2 py-1 border border-border border-dashed rounded-full text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Tag
              </button>
            )}
          </div>

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[65vh] text-foreground resize-none focus:outline-none bg-transparent font-serif leading-relaxed text-lg md:text-xl placeholder:opacity-30"
              placeholder="Start describing your world..."
            />
          </div>
        </div>
      }
    />
  );
}
