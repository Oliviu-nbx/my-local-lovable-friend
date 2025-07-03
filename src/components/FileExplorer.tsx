import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectState, DirectoryNode, ProjectFile } from '@/types/tools';
import { 
  Folder, 
  FolderOpen,
  File, 
  FileText, 
  Code, 
  Image, 
  Download,
  Trash2,
  Plus,
  FolderPlus,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FileExplorerProps {
  project: ProjectState | null;
  onFileSelect?: (path: string) => void;
  onFileDelete?: (path: string) => void;
  onCreateDirectory?: (path: string) => void;
  selectedFile?: string;
}

export function FileExplorer({ 
  project, 
  onFileSelect, 
  onFileDelete, 
  onCreateDirectory,
  selectedFile 
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [showCreateDir, setShowCreateDir] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [createDirParent, setCreateDirParent] = useState('');

  if (!project) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No project selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build directory tree from flat file structure
  const buildDirectoryTree = (files: Record<string, ProjectFile>): DirectoryNode => {
    const root: DirectoryNode = {
      name: project.name,
      path: '',
      type: 'directory',
      children: []
    };

    const allPaths = Object.keys(files).sort();
    const directoryMap = new Map<string, DirectoryNode>();
    directoryMap.set('', root);

    // First, create all directory nodes
    allPaths.forEach(path => {
      const file = files[path];
      if (file.type === 'directory') {
        const pathParts = path.split('/');
        const name = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join('/');
        
        const dirNode: DirectoryNode = {
          name,
          path,
          type: 'directory',
          children: [],
          file
        };
        
        directoryMap.set(path, dirNode);
        
        const parent = directoryMap.get(parentPath);
        if (parent) {
          parent.children!.push(dirNode);
        }
      }
    });

    // Then, add file nodes
    allPaths.forEach(path => {
      const file = files[path];
      if (file.type === 'file') {
        const pathParts = path.split('/');
        const name = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join('/');
        
        const fileNode: DirectoryNode = {
          name,
          path,
          type: 'file',
          file
        };
        
        const parent = directoryMap.get(parentPath);
        if (parent) {
          parent.children!.push(fileNode);
        }
      }
    });

    // Sort children: directories first, then files, alphabetically
    const sortChildren = (node: DirectoryNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      }
    };
    
    sortChildren(root);
    return root;
  };

  const getFileIcon = (path: string, type: 'file' | 'directory') => {
    if (type === 'directory') {
      const isExpanded = expandedFolders.has(path);
      return isExpanded ? 
        <FolderOpen className="w-4 h-4 text-blue-500" /> : 
        <Folder className="w-4 h-4 text-blue-500" />;
    }
    
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="w-4 h-4 text-yellow-500" />;
      case 'css':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'json':
        return <Code className="w-4 h-4 text-green-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-purple-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const downloadFile = (path: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateDirectory = () => {
    if (!newDirName.trim()) return;
    
    const fullPath = createDirParent ? `${createDirParent}/${newDirName.trim()}` : newDirName.trim();
    onCreateDirectory?.(fullPath);
    setNewDirName('');
    setShowCreateDir(false);
    setCreateDirParent('');
    
    // Expand parent directory
    if (createDirParent) {
      setExpandedFolders(prev => new Set([...prev, createDirParent]));
    }
  };

  const renderNode = (node: DirectoryNode, depth: number = 0): JSX.Element => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer hover:bg-sidebar-accent group transition-smooth ${
            isSelected ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleFolder(node.path);
            } else {
              onFileSelect?.(node.path);
            }
          }}
        >
          {/* Chevron for directories */}
          {node.type === 'directory' && (
            <div className="w-4 h-4 flex items-center justify-center">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )
              ) : null}
            </div>
          )}
          
          {/* Icon */}
          <div className="w-4 h-4 flex items-center justify-center">
            {getFileIcon(node.path, node.type)}
          </div>
          
          {/* Name */}
          <span className="flex-1 text-sm truncate" title={node.name}>
            {node.name}
          </span>
          
          {/* Actions */}
          {node.type === 'file' && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.file) {
                    downloadFile(node.path, node.file.content);
                  }
                }}
              >
                <Download className="w-3 h-3" />
              </Button>
              
              {onFileDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete file</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{node.path}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onFileDelete(node.path)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}

          {/* Directory actions */}
          {node.type === 'directory' && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateDirParent(node.path);
                  setShowCreateDir(true);
                }}
                title="Create subdirectory"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Children */}
        {node.type === 'directory' && isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const directoryTree = buildDirectoryTree(project.files);
  const totalFiles = Object.values(project.files).filter(f => f.type === 'file').length;
  const totalDirs = Object.values(project.files).filter(f => f.type === 'directory').length;

  return (
    <Card className="h-full flex flex-col bg-sidebar border-sidebar-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sidebar-foreground">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            <span>Files</span>
            <span className="text-sm font-normal text-muted-foreground">
              ({totalFiles} files, {totalDirs} dirs)
            </span>
          </div>
          
          {onCreateDirectory && (
            <Dialog open={showCreateDir} onOpenChange={setShowCreateDir}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    setCreateDirParent('');
                    setShowCreateDir(true);
                  }}
                  title="Create new directory"
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Directory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {createDirParent && (
                    <div className="text-sm text-muted-foreground">
                      Parent: {createDirParent || 'root'}
                    </div>
                  )}
                  <Input
                    value={newDirName}
                    onChange={(e) => setNewDirName(e.target.value)}
                    placeholder="Directory name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateDirectory();
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDir(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateDirectory} disabled={!newDirName.trim()}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="flex-1">
          <div className="p-3">
            {directoryTree.children && directoryTree.children.length > 0 ? (
              directoryTree.children.map(child => renderNode(child, 0))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sidebar-foreground">No files yet</p>
                <p className="text-sm text-muted-foreground">Ask the AI to create files for your project</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}