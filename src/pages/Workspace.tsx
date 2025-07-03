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
import { Plus } from 'lucide-react';

export function Workspace() {
  const projectManager = useProjectManager();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
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
      <div className="h-full flex flex-col">
        {/* Project Selector Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Workspace</h2>
            <div className="flex items-center gap-2">
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
          </div>
        </div>
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - Chat */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <ChatInterface key={refreshKey} />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Right Panel - Development Environment */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              {/* Top - Preview */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4">
                  <ProjectPreview key={refreshKey} project={currentProject} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle />
              
              {/* Bottom - Files and Editor */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4 bg-sidebar">
                  <Tabs defaultValue="files" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 bg-sidebar-accent">
                      <TabsTrigger value="files" className="text-sidebar-foreground">File Explorer</TabsTrigger>
                      <TabsTrigger value="editor" className="text-sidebar-foreground">Code Editor</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="files" className="flex-1 mt-4">
                      <FileExplorer
                        key={refreshKey}
                        project={currentProject}
                        onFileSelect={handleFileSelect}
                        onFileDelete={handleFileDelete}
                        onCreateDirectory={handleCreateDirectory}
                        selectedFile={selectedFile}
                      />
                    </TabsContent>
                    
                    <TabsContent value="editor" className="flex-1 mt-4">
                      <CodeEditor
                        key={refreshKey}
                        file={selectedFileData}
                        onSave={handleFileSave}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
}

export default Workspace;