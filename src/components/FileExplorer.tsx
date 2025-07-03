import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectState } from '@/types/tools';
import { 
  Folder, 
  File, 
  FileText, 
  Code, 
  Image, 
  Download,
  Trash2,
  Plus
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

interface FileExplorerProps {
  project: ProjectState | null;
  onFileSelect?: (path: string) => void;
  onFileDelete?: (path: string) => void;
  selectedFile?: string;
}

export function FileExplorer({ 
  project, 
  onFileSelect, 
  onFileDelete, 
  selectedFile 
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

  const getFileIcon = (path: string) => {
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

  const files = Object.entries(project.files).sort(([a], [b]) => a.localeCompare(b));

  return (
    <Card className="h-full flex flex-col bg-sidebar border-sidebar-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sidebar-foreground">
          <Folder className="w-5 h-5" />
          Files
          <span className="text-sm font-normal text-muted-foreground">
            ({files.length})
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {files.map(([path, file]) => (
              <div
                key={path}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-sidebar-accent group transition-smooth ${
                  selectedFile === path ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground'
                }`}
                onClick={() => onFileSelect?.(path)}
              >
                {getFileIcon(path)}
                <span className="flex-1 text-sm truncate font-mono" title={path}>
                  {path}
                </span>
                
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(path, file.content);
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
                            Are you sure you want to delete "{path}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onFileDelete(path)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
            
            {files.length === 0 && (
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