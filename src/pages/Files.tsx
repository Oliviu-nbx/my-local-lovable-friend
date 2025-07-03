import { useState } from "react";
import { Folder, File, Code, Search, Plus, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  size?: number;
  modified?: Date;
}

// Mock file system data
const mockFiles: FileNode[] = [
  {
    name: "src",
    type: "folder",
    path: "/src",
    children: [
      { name: "components", type: "folder", path: "/src/components", children: [] },
      { name: "pages", type: "folder", path: "/src/pages", children: [] },
      { name: "utils", type: "folder", path: "/src/utils", children: [] },
      { name: "App.tsx", type: "file", path: "/src/App.tsx", size: 2048, modified: new Date() },
      { name: "main.tsx", type: "file", path: "/src/main.tsx", size: 512, modified: new Date() },
    ]
  },
  {
    name: "public",
    type: "folder",
    path: "/public",
    children: [
      { name: "index.html", type: "file", path: "/public/index.html", size: 1024, modified: new Date() },
    ]
  },
  { name: "package.json", type: "file", path: "/package.json", size: 4096, modified: new Date() },
  { name: "README.md", type: "file", path: "/README.md", size: 2048, modified: new Date() },
];

export function Files() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/src"]));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes
      .filter(node => 
        searchTerm === "" || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((node) => (
        <div key={node.path}>
          <div
            className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer transition-smooth ${
              selectedFile === node.path 
                ? 'bg-primary/20 text-primary' 
                : 'hover:bg-accent/50'
            }`}
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
            onClick={() => {
              if (node.type === 'folder') {
                toggleFolder(node.path);
              } else {
                setSelectedFile(node.path);
              }
            }}
          >
            {node.type === 'folder' ? (
              <Folder 
                className={`w-4 h-4 ${
                  expandedFolders.has(node.path) ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
            ) : (
              getFileIcon(node.name)
            )}
            
            <span className="text-sm">{node.name}</span>
            
            {node.type === 'file' && node.size && (
              <span className="ml-auto text-xs text-muted-foreground">
                {(node.size / 1024).toFixed(1)}KB
              </span>
            )}
          </div>
          
          {node.type === 'folder' && 
           expandedFolders.has(node.path) && 
           node.children && (
            <div>
              {renderFileTree(node.children, depth + 1)}
            </div>
          )}
        </div>
      ));
  };

  return (
    <Layout>
      <div className="flex h-full">
        {/* File Explorer Sidebar */}
        <div className="w-80 border-r border-border bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Files</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* File Tree */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {renderFileTree(mockFiles)}
            </div>
          </ScrollArea>
        </div>

        {/* File Preview/Editor */}
        <div className="flex-1 bg-editor-bg">
          {selectedFile ? (
            <div className="h-full flex flex-col">
              {/* File Header */}
              <div className="flex items-center gap-2 p-4 border-b border-code-border bg-code-bg">
                {getFileIcon(selectedFile.split('/').pop() || '')}
                <span className="text-sm font-medium">{selectedFile}</span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">Preview</Button>
                </div>
              </div>

              {/* File Content */}
              <div className="flex-1 p-6">
                <Card className="h-full bg-code-bg border-code-border p-4">
                  <pre className="text-sm text-muted-foreground font-mono">
                    {`// File: ${selectedFile}
// This is a preview of the selected file.
// In a real implementation, this would show the actual file contents.

export default function Component() {
  return (
    <div>
      <h1>Hello from ${selectedFile.split('/').pop()}</h1>
    </div>
  );
}`}
                  </pre>
                </Card>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No file selected</h3>
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