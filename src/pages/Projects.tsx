import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProjectManager } from '@/hooks/useProjectManager';
import { Plus, Folder, Trash2, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

export function Projects() {
  const [newProjectName, setNewProjectName] = useState('');
  const projectManager = useProjectManager();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const allProjects = projectManager.getAllProjects();

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive"
      });
      return;
    }

    const projectId = projectManager.createProject(newProjectName.trim());
    setNewProjectName('');
    
    toast({
      title: "Project created",
      description: `Created project "${newProjectName}"`
    });

    // Navigate to development page with new project
    navigate('/development');
  };

  const handleSelectProject = (projectId: string) => {
    projectManager.setCurrentProject(projectId);
    navigate('/development');
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    projectManager.deleteProject(projectId);
    toast({
      title: "Project deleted",
      description: `Deleted project "${projectName}"`
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Create and manage your AI-generated projects</p>
        </div>

        {/* Create New Project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleCreateProject} className="gap-2">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Folder className="w-5 h-5" />
                    {project.name}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete project</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{project.name}"? This will remove all files and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created: {new Date().toLocaleDateString()}
                    </div>
                    <div className="mt-1">
                      Files: {Object.keys(project.files).length}
                    </div>
                  </div>

                  {Object.keys(project.files).length > 0 && (
                    <div className="text-xs">
                      <strong>Files:</strong>
                      <div className="mt-1 space-y-1">
                        {Object.keys(project.files).slice(0, 3).map(path => (
                          <div key={path} className="text-muted-foreground truncate">
                            {path}
                          </div>
                        ))}
                        {Object.keys(project.files).length > 3 && (
                          <div className="text-muted-foreground">
                            +{Object.keys(project.files).length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleSelectProject(project.id)}
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <Eye className="w-4 h-4" />
                    Open Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {allProjects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first project to start building with AI assistance
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

export default Projects;