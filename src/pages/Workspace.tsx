import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ChatInterface } from '@/components/ChatInterface';
import { ProjectPreview } from '@/components/ProjectPreview';
import { FileExplorer } from '@/components/FileExplorer';
import { CodeEditor } from '@/components/CodeEditor';
import { useProjectManager } from '@/hooks/useProjectManager';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Code, Eye, FolderOpen } from 'lucide-react';

export function Workspace() {
  const projectManager = useProjectManager();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  
  const currentProject = projectManager.getCurrentProject();
  const allProjects = projectManager.getAllProjects();
  
  // Force refresh when project changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [currentProject]);
  
  const selectedFileData = selectedFile && currentProject?.files[selectedFile] 
    ? currentProject.files[selectedFile] 
    : null;

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
  };

  const handleFileDelete = (path: string) => {
    if (projectManager.currentProject) {
      projectManager.executeFileOperation(projectManager.currentProject, {
        type: 'delete',
        path
      });
    }
    if (selectedFile === path) {
      setSelectedFile(null);
    }
  };

  const handleFileSave = (path: string, content: string) => {
    if (projectManager.currentProject) {
      projectManager.executeFileOperation(projectManager.currentProject, {
        type: 'update',
        path,
        content
      });
      setRefreshKey(prev => prev + 1); // Force refresh
    }
  };

  const handleCreateDirectory = (path: string) => {
    if (projectManager.currentProject) {
      projectManager.createDirectory(projectManager.currentProject, path);
      setRefreshKey(prev => prev + 1); // Force refresh
    }
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Project Selector Header */}
        <div className="flex-shrink-0 p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Workspace</h2>
              <div className="w-64">
                <Select value={projectManager.currentProject || ""} onValueChange={projectManager.setCurrentProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const name = prompt('Enter project name:');
                  if (name?.trim()) {
                    projectManager.createProject(name.trim());
                  }
                }}
                className="h-10 w-10 shrink-0"
                title="Create new project"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* View Toggle - Lovable Style */}
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('preview')}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                variant={activeView === 'code' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveView('code')}
                className="gap-2"
              >
                <Code className="w-4 h-4" />
                Code
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex min-h-0">
          {/* Left Panel - Chat with Fixed Height */}
          <div className="w-1/2 border-r border-border flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ChatInterface key={refreshKey} />
            </div>
          </div>
          
          {/* Right Panel - Preview or Code */}
          <div className="w-1/2 flex flex-col">
            {activeView === 'preview' ? (
              <div className="flex-1 p-4">
                <ProjectPreview key={refreshKey} project={currentProject} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col bg-sidebar">
                {/* Code View Header */}
                <div className="flex-shrink-0 p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span className="text-sm font-medium">Code Editor</span>
                  </div>
                </div>
                
                <div className="flex-1 flex min-h-0">
                  {/* File Explorer Sidebar */}
                  <div className="w-1/3 border-r border-border p-4 overflow-auto">
                    <FileExplorer
                      key={refreshKey}
                      project={currentProject}
                      onFileSelect={handleFileSelect}
                      onFileDelete={handleFileDelete}
                      onCreateDirectory={handleCreateDirectory}
                      selectedFile={selectedFile}
                    />
                  </div>
                  
                  {/* Code Editor */}
                  <div className="flex-1 p-4">
                    <CodeEditor
                      key={refreshKey}
                      file={selectedFileData}
                      onSave={handleFileSave}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Workspace;