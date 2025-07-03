import { useState } from "react";
import { Folder, File, Code, Search, Plus, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { useProjectManager } from "@/hooks/useProjectManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Files() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const projectManager = useProjectManager();
  
  const currentProject = projectManager.getCurrentProject();
  const allProjects = projectManager.getAllProjects();
  const files = currentProject ? Object.entries(currentProject.files) : [];

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'ts':
      case 'js':
      case 'jsx':
        return <Code className="w-4 h-4 text-info" />;
      case 'json':
        return <File className="w-4 h-4 text-warning" />;
      case 'md':
        return <File className="w-4 h-4 text-primary" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderFileTree = () => {
    return files
      .filter(([path]) => 
        searchTerm === "" || 
        path.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(([path, file]) => (
        <div key={path}>
          <div
            className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-sidebar-accent transition-smooth ${
              selectedFile === path 
                ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                : 'text-sidebar-foreground'
            }`}
            onClick={() => setSelectedFile(path)}
          >
            {getFileIcon(path)}
            
            <span className="text-sm font-mono">{path}</span>
            
            <span className="ml-auto text-xs text-muted-foreground">
              {(file.content.length / 1024).toFixed(1)}KB
            </span>
          </div>
        </div>
      ));
  };

  return (
    <Layout>
      <div className="flex h-full">
        {/* File Explorer Sidebar */}
        <div className="w-80 border-r border-sidebar-border bg-sidebar">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-sidebar-foreground">Files</h2>
            </div>
            
            {/* Project Selector */}
            <div className="mb-4">
              <Select value={projectManager.currentProject || ""} onValueChange={projectManager.setCurrentProject}>
                <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
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
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
              />
            </div>
          </div>

          {/* File Tree */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {files.length > 0 ? renderFileTree() : (
                <div className="text-center text-muted-foreground py-8">
                  <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No files yet</p>
                  <p className="text-sm">Create files in Development page</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* File Preview/Editor */}
        <div className="flex-1 bg-editor-bg">
          {selectedFile && currentProject?.files[selectedFile] ? (
            <div className="h-full flex flex-col">
              {/* File Header */}
              <div className="flex items-center gap-2 p-4 border-b border-code-border bg-code-bg">
                {getFileIcon(selectedFile)}
                <span className="text-sm font-medium text-foreground font-mono">{selectedFile}</span>
              </div>

              {/* File Content */}
              <div className="flex-1 p-0">
                <div className="h-full bg-code-bg">
                  <pre className="text-sm text-foreground font-mono p-4 h-full overflow-auto">
                    <code>{currentProject.files[selectedFile].content}</code>
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-editor-bg">
              <div className="text-center">
                <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">No file selected</h3>
                <p className="text-muted-foreground">
                  Select a file from the explorer to view its contents
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Files;