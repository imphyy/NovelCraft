import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, chaptersAPI, wikiAPI } from '../api/client';
import { AskAI } from '../components/AskAI';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AppShell } from '../components/layout/AppShell';
import { SectionHeader } from '../components/scaffolding/SectionHeader';
import { EmptyState } from '../components/scaffolding/EmptyState';
import { ListBlock } from '../components/scaffolding/ListBlock';
import { StatRow } from '../components/scaffolding/StatRow';
import { BookOpen, Library, PenTool } from 'lucide-react';
import type { WikiPage } from '../types/wiki';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  status: string;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const [projectRes, chaptersRes, wikiRes] = await Promise.all([
        projectsAPI.get(projectId!),
        chaptersAPI.list(projectId!),
        wikiAPI.list(projectId!),
      ]);
      setProject(projectRes.data);
      setChapters(chaptersRes.data || []);
      setWikiPages(wikiRes.data || []);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const totalWords = chapters?.reduce((sum, ch) => sum + ch.wordCount, 0) || 0;
  const lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;
  const recentChapters = chapters.slice(-5).reverse();
  const recentWikiPages = wikiPages.slice(0, 5);

  return (
    <AppShell
      title={project?.name}
      main={
        <div className="relative pl-8">
          {/* Visual Motif: Left gutter accent */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-border/40" />

          {/* Hero Header */}
          <div className="mb-12">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-5xl font-serif text-foreground tracking-tight mb-4">
                  {project?.name}
                </h1>
                <p className="text-base text-muted-foreground max-w-2xl leading-relaxed mb-3">
                  {project?.description}
                </p>
                <p className="text-xs text-muted-foreground/50 italic">
                  {chapters.length > 0 ? `Last edited recently` : 'Start your manuscript today'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => navigate(`/projects/${projectId}/editor`)}
                  className="rounded-none px-8 h-10 text-xs font-semibold uppercase tracking-widest"
                >
                  <PenTool className="h-3 w-3 mr-2" />
                  {lastChapter ? 'Continue Writing' : 'New Chapter'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/projects/${projectId}/wiki`)}
                  className="rounded-none px-8 h-10 text-xs font-semibold uppercase tracking-widest"
                >
                  <Library className="h-3 w-3 mr-2" />
                  Open Wiki
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <StatRow
              stats={[
                { label: 'Chapters', value: chapters.length },
                { label: 'Total Words', value: totalWords.toLocaleString() },
                { label: 'Wiki Pages', value: wikiPages.length },
                { label: 'Goal', value: '—' },
              ]}
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-12">
            <TabsList className="bg-transparent border-b border-border/10 w-full justify-start rounded-none h-auto p-0 gap-10">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary/40 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-xs font-semibold uppercase tracking-widest transition-all text-muted-foreground/60 data-[state=active]:text-foreground"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary/40 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-xs font-semibold uppercase tracking-widest transition-all text-muted-foreground/60 data-[state=active]:text-foreground"
              >
                Ask AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-16 outline-none">
              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* LEFT COLUMN - Main content */}
                <div className="lg:col-span-2 space-y-16">
                  {/* Continue Writing Block */}
                  {lastChapter ? (
                    <div className="space-y-4">
                      <SectionHeader title="Continue Writing" />
                      <div
                        onClick={() => navigate(`/projects/${projectId}/editor`)}
                        className="p-6 bg-muted/5 border border-border/40 rounded-sm hover:border-primary/40 hover:bg-muted/10 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-serif group-hover:text-primary transition-colors mb-2">
                              {lastChapter.title}
                            </h3>
                            <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">
                              {lastChapter.wordCount.toLocaleString()} words • {lastChapter.status}
                            </p>
                          </div>
                          <BookOpen className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/40 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <SectionHeader title="Continue Writing" />
                      <EmptyState
                        title="No chapters yet"
                        description="Start your manuscript by creating your first chapter."
                        primaryAction={{
                          label: 'Create First Chapter',
                          onClick: () => navigate(`/projects/${projectId}/editor`),
                        }}
                        secondaryAction={{
                          label: 'Open Wiki',
                          onClick: () => navigate(`/projects/${projectId}/wiki`),
                        }}
                      />
                    </div>
                  )}

                  {/* Recent Chapters */}
                  <ListBlock
                    title="Recent Chapters"
                    items={recentChapters}
                    maxItems={5}
                    renderItem={(chapter) => (
                      <div
                        onClick={() => navigate(`/projects/${projectId}/editor`)}
                        className="group flex justify-between items-center py-4 px-4 hover:bg-muted/5 transition-colors cursor-pointer"
                      >
                        <div className="space-y-1 flex-1">
                          <p className="text-base font-serif group-hover:text-primary transition-colors">
                            {chapter.title}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                            <span>{chapter.wordCount.toLocaleString()} words</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{chapter.status}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    emptyState={{
                      title: 'Your manuscript awaits',
                      description: 'Create chapters to begin writing your story.',
                      primaryAction: {
                        label: 'Create First Chapter',
                        onClick: () => navigate(`/projects/${projectId}/editor`),
                      },
                    }}
                    viewAllLink={
                      chapters.length > 5
                        ? {
                            label: 'View All Chapters',
                            onClick: () => navigate(`/projects/${projectId}/editor`),
                          }
                        : undefined
                    }
                  />

                  {/* Chapters Overview with Onboarding */}
                  {chapters.length === 0 && (
                    <div className="space-y-4">
                      <SectionHeader title="Getting Started" subtitle="Follow these steps to begin" />
                      <EmptyState
                        title="Welcome to your writing workspace"
                        description="Let's get you started with your manuscript. Follow these three simple steps."
                        steps={[
                          {
                            number: 1,
                            title: 'Create your first chapter',
                            action: {
                              label: 'New Chapter',
                              onClick: () => navigate(`/projects/${projectId}/editor`),
                            },
                          },
                          {
                            number: 2,
                            title: 'Add characters and world-building to the wiki',
                            action: {
                              label: 'Open Wiki',
                              onClick: () => navigate(`/projects/${projectId}/wiki`),
                            },
                          },
                          {
                            number: 3,
                            title: 'Ask the AI assistant about your story',
                            action: {
                              label: 'Ask AI',
                              onClick: () => {
                                const aiTab = document.querySelector('[value="ai"]') as HTMLElement;
                                aiTab?.click();
                              },
                            },
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN - Sidebar widgets */}
                <div className="space-y-12">
                  {/* Quick Notes UI Scaffold */}
                  <div className="space-y-4">
                    <SectionHeader title="Quick Notes" />
                    <div className="p-4 bg-muted/5 border border-border/20 rounded-sm">
                      <Textarea
                        placeholder="Jot down ideas, reminders, or plot threads..."
                        className="min-h-[120px] bg-transparent border-none focus:ring-0 text-sm resize-none p-0"
                        disabled
                      />
                      <p className="text-[10px] text-muted-foreground/40 italic mt-2">
                        Coming soon
                      </p>
                    </div>
                  </div>

                  {/* Writing Goals UI Scaffold */}
                  <div className="space-y-4">
                    <SectionHeader title="Writing Goals" />
                    <div className="p-4 bg-muted/5 border border-border/20 rounded-sm space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">This week</span>
                        <span className="text-lg font-serif text-foreground">—</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">Daily target</span>
                        <span className="text-lg font-serif text-foreground">—</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/40 italic pt-2 border-t border-border/10">
                        Coming soon
                      </p>
                    </div>
                  </div>

                  {/* Wiki Highlights */}
                  <ListBlock
                    title="Wiki Highlights"
                    items={recentWikiPages}
                    maxItems={5}
                    renderItem={(page) => (
                      <div
                        onClick={() => navigate(`/projects/${projectId}/wiki/${page.id}`)}
                        className="group py-3 px-3 hover:bg-muted/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-base opacity-70">{page.pageType === 'character' ? '👤' : page.pageType === 'location' ? '📍' : '💡'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                              {page.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-1">
                              {page.pageType}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    emptyState={{
                      title: 'No wiki pages',
                      description: 'Create pages for characters, locations, and lore.',
                      primaryAction: {
                        label: 'Create Wiki Page',
                        onClick: () => navigate(`/projects/${projectId}/wiki`),
                      },
                    }}
                    viewAllLink={
                      wikiPages.length > 5
                        ? {
                            label: 'View All',
                            onClick: () => navigate(`/projects/${projectId}/wiki`),
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="outline-none">
              <div className="max-w-3xl">
                 <AskAI projectId={projectId!} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
