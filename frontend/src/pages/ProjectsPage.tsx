import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsAPI } from '../api/client';
import { Button } from '@/components/ui/button';
import { AppShell } from '../components/layout/AppShell';
import { Modal, ModalHeader, ModalFooter, ModalCancelButton } from '@/components/ui/modal';
import { FormField, FormInput, FormTextarea, FormError } from '@/components/ui/form-field';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await projectsAPI.create(name, description);
      const newProject = response.data.project;
      setProjects([newProject, ...projects]);
      setShowCreateModal(false);
      setName('');
      setDescription('');
      navigate(`/projects/${newProject.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <AppShell
      title="My Projects"
      hideRight
      main={
        <div className="relative pl-8">
          {/* Visual Motif: Left gutter accent */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-border/40" />

          <div className="flex justify-between items-baseline mb-20">
            <div>
              <h1 className="text-5xl font-serif text-foreground tracking-tight mb-4">My Projects</h1>
              <p className="text-base text-muted-foreground">Manage your writing projects and chronicles</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-none px-8 h-10 text-xs font-semibold uppercase tracking-widest shadow-none"
            >
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="py-24 max-w-lg border-t border-border/10">
              <h3 className="text-2xl font-serif font-medium text-foreground mb-4">No projects yet</h3>
              <p className="text-muted-foreground/60 mb-10 leading-relaxed">Your literary journey begins here. Create your first project to start writing.</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="secondary"
                className="rounded-none px-10 h-12 text-xs font-semibold uppercase tracking-widest"
              >
                Create your first project
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="group cursor-pointer py-10 border-t border-border/10 first:border-t-0 hover:bg-muted/5 transition-colors"
                >
                  <div className="flex justify-between items-start gap-8">
                    <div className="space-y-4 max-w-2xl">
                      <h3 className="text-3xl font-serif text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-base text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {project.description || 'No description provided for this manuscript.'}
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold">
                          Last edited {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                      <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase tracking-widest">
                        Open Project
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t border-border/10" />
            </div>
          )}

          <Modal open={showCreateModal} onOpenChange={setShowCreateModal}>
            <ModalHeader
              title="Begin a New Project"
              description="Every great story starts with a single word."
            />
            <form onSubmit={handleCreateProject}>
              {error && <FormError>{error}</FormError>}
              <div className="space-y-8">
                <FormField label="Project Name" htmlFor="name">
                  <FormInput
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="The Great American Novel"
                    serif
                  />
                </FormField>
                <FormField label="Description" htmlFor="description">
                  <FormTextarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="A brief description of your project..."
                  />
                </FormField>
              </div>
              <ModalFooter>
                <ModalCancelButton
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setName('');
                    setDescription('');
                  }}
                  disabled={creating}
                />
                <Button
                  type="submit"
                  disabled={creating}
                  className="rounded-none px-10 h-11 text-xs font-semibold uppercase tracking-widest"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </Button>
              </ModalFooter>
            </form>
          </Modal>
        </div>
      }
    />
  );
}
