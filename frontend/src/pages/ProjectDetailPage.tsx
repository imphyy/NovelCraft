import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, chaptersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { AskAI } from '../components/AskAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AppShell } from '../components/layout/AppShell';

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
  const { logout } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const [projectRes, chaptersRes] = await Promise.all([
        projectsAPI.get(projectId!),
        chaptersAPI.list(projectId!),
      ]);
      setProject(projectRes.data);
      setChapters(chaptersRes.data);
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

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  return (
    <AppShell
      title={project?.name}
      main={
        <div className="space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold font-serif mb-2">{project?.name}</h1>
            <p className="text-muted-foreground">{project?.description}</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai">Ask AI</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/40 border-border/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Chapters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold font-serif">{chapters.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/40 border-border/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Words</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold font-serif">{totalWords.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate(`/projects/${projectId}/editor`)}
                >
                  Open Editor
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/projects/${projectId}/wiki`)}
                >
                  Open Wiki
                </Button>
              </div>

              {/* Chapters List */}
              <Card className="bg-card/40 border-border/50 overflow-hidden shadow-sm">
                <CardHeader className="bg-muted/20 border-b border-border/50">
                  <CardTitle className="text-lg font-serif">Chapters</CardTitle>
                  <CardDescription className="text-xs">
                    {chapters.length === 0 ? 'No chapters yet' : `${chapters.length} chapters`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {chapters.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex justify-between items-center p-4 hover:bg-muted/40 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/projects/${projectId}/editor`)}
                        >
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors font-serif">{chapter.title}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-tighter">
                              {chapter.wordCount.toLocaleString()} words · {chapter.status}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-12 text-sm italic">
                      No chapters yet. Open the editor to create your first chapter.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <div className="bg-background/30 rounded-lg p-4 border border-border">
                 <AskAI projectId={projectId!} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
}
