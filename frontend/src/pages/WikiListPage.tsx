import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wikiAPI } from '../api/client';
import type { WikiPage, WikiPageType } from '../types/wiki';
import { WIKI_PAGE_TYPES } from '../types/wiki';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '../components/scaffolding/EmptyState';
import { SectionHeader } from '../components/scaffolding/SectionHeader';
import { Library } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WikiListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<WikiPageType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pageType, setPageType] = useState<WikiPageType>('character');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPages();
  }, [projectId]);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredPages(pages);
    } else {
      setFilteredPages(pages.filter(p => p.pageType === selectedType));
    }
  }, [selectedType, pages]);

  const loadPages = async () => {
    try {
      const response = await wikiAPI.list(projectId!);
      setPages(response.data);
    } catch (err) {
      console.error('Failed to load wiki pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await wikiAPI.create(projectId!, title, pageType);
      const newPage = response.data;
      setPages([newPage, ...pages]);
      setShowCreateModal(false);
      setTitle('');
      navigate(`/projects/${projectId}/wiki/${newPage.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  const getTypeIcon = (type: WikiPageType) => {
    return WIKI_PAGE_TYPES.find(t => t.value === type)?.icon || '📄';
  };

  const getTypeCount = (type: WikiPageType) => {
    return pages.filter(p => p.pageType === type).length;
  };

  const leftContext = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Library className="h-3 w-3" />
          Wiki
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="text-xs text-primary hover:underline font-medium"
        >
          + New
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase mb-2 px-1">Filter by Type</h3>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSelectedType('all')}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                selectedType === 'all'
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              All Pages ({pages.length})
            </button>
            {WIKI_PAGE_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between",
                  selectedType === type.value
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span>{type.label}</span>
                <span className="opacity-60">{getTypeCount(type.value)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading wiki...</div>
      </div>
    );
  }

  return (
    <AppShell
      title="Project Wiki"
      leftContext={leftContext}
      main={
        <div className="py-4 space-y-8">
          <SectionHeader
            title="Lore Wiki"
            subtitle="Characters, places, factions, and world-building"
            actions={
              <Button onClick={() => setShowCreateModal(true)} size="sm" className="rounded-none px-6 h-9 text-xs font-semibold uppercase tracking-widest">
                New Page
              </Button>
            }
          />

          {filteredPages.length === 0 ? (
            pages.length === 0 ? (
              <EmptyState
                icon={<Library className="h-16 w-16" />}
                title="Build your story's encyclopedia"
                description="Create wiki pages to document characters, locations, events, and lore. Keep everything consistent and searchable."
                primaryAction={{
                  label: 'Create First Wiki Page',
                  onClick: () => setShowCreateModal(true),
                }}
                steps={[
                  {
                    number: 1,
                    title: 'Create a character page for your protagonist',
                    action: {
                      label: 'New Character',
                      onClick: () => {
                        setPageType('character');
                        setShowCreateModal(true);
                      },
                    },
                  },
                  {
                    number: 2,
                    title: 'Document key locations in your world',
                    action: {
                      label: 'New Location',
                      onClick: () => {
                        setPageType('location');
                        setShowCreateModal(true);
                      },
                    },
                  },
                  {
                    number: 3,
                    title: 'Define factions, items, or concepts',
                    action: {
                      label: 'New Page',
                      onClick: () => setShowCreateModal(true),
                    },
                  },
                ]}
              />
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm text-muted-foreground/60 italic">
                  No pages match this filter. Try selecting "All Pages" or create a new page.
                </p>
              </div>
            )
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-4">
                <p className="text-xs text-muted-foreground">
                  {filteredPages.length} {filteredPages.length === 1 ? 'page' : 'pages'}
                  {selectedType !== 'all' && ` • ${WIKI_PAGE_TYPES.find(t => t.value === selectedType)?.label}`}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => navigate(`/projects/${projectId}/wiki/${page.id}`)}
                    className="p-5 bg-muted/5 border border-border/40 rounded-sm hover:border-primary/40 hover:bg-muted/10 transition-all cursor-pointer group shadow-none hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity" role="img" aria-label={page.pageType}>
                        {getTypeIcon(page.pageType)}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 bg-muted/20 px-1.5 py-0.5 rounded">
                        {page.pageType}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium group-hover:text-primary transition-colors mb-1 font-serif">
                      {page.title}
                    </h3>
                    {page.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {page.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] bg-primary/5 text-primary/70 px-1.5 py-0.5 rounded-sm border border-primary/10">
                            #{tag}
                          </span>
                        ))}
                        {page.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground/50 self-center ml-1">+{page.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-card rounded-sm shadow-paper max-w-md w-full p-8 border border-border/80">
                <h3 className="text-2xl font-semibold mb-6 font-serif">New Wiki Page</h3>
                <form onSubmit={handleCreatePage} className="space-y-5">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md text-xs">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title</label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/10 border border-border/40 rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-sm transition-all"
                      placeholder="Page Title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {WIKI_PAGE_TYPES.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setPageType(type.value)}
                          className={cn(
                            "px-3 py-2.5 rounded-md text-xs font-medium border transition-all",
                            pageType === type.value
                              ? "bg-primary/5 border-primary/40 text-primary shadow-sm"
                              : "bg-transparent border-border/40 text-muted-foreground/70 hover:bg-muted/10"
                          )}
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-10">
                    <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)} className="text-sm">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating} className="text-sm px-6">
                      {creating ? 'Creating...' : 'Create Page'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
