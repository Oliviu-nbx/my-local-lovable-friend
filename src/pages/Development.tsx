import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { ChatInterface } from '@/components/ChatInterface';
import { ProjectPreview } from '@/components/ProjectPreview';
import { FileExplorer } from '@/components/FileExplorer';
import { CodeEditor } from '@/components/CodeEditor';
import { useProjectManager } from '@/hooks/useProjectManager';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function Development() {
  const projectManager = useProjectManager();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  const currentProject = projectManager.getCurrentProject();
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
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - Chat */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <ChatInterface />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Right Panel - Development Environment */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              {/* Top - Preview */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4">
                  <ProjectPreview project={currentProject} />
                </div>
              </ResizablePanel>
              
              <ResizableHandle />
              
              {/* Bottom - Files and Editor */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4">
                  <Tabs defaultValue="files" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="files">File Explorer</TabsTrigger>
                      <TabsTrigger value="editor">Code Editor</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="files" className="flex-1 mt-4">
                      <FileExplorer
                        project={currentProject}
                        onFileSelect={handleFileSelect}
                        onFileDelete={handleFileDelete}
                        selectedFile={selectedFile}
                      />
                    </TabsContent>
                    
                    <TabsContent value="editor" className="flex-1 mt-4">
                      <CodeEditor
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

export default Development;