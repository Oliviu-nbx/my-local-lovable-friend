import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectState } from '@/types/tools';
import { ExternalLink, Code, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProjectPreviewProps {
  project: ProjectState | null;
}

export function ProjectPreview({ project }: ProjectPreviewProps) {
  if (!project) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No project selected</p>
            <p className="text-sm">Create a project to see the preview here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasHtmlFile = Object.keys(project.files).some(path => path.endsWith('.html'));
  const mainHtmlFile = Object.keys(project.files).find(path => 
    path === 'index.html' || path.endsWith('index.html')
  ) || Object.keys(project.files).find(path => path.endsWith('.html'));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {project.name}
          </span>
          {project.previewUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(project.previewUrl, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        {hasHtmlFile && project.previewUrl ? (
          <div className="flex-1 border rounded-md overflow-hidden">
            <iframe
              src={project.previewUrl}
              className="w-full h-full"
              title={`Preview of ${project.name}`}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border rounded-md bg-muted/20">
            <div className="text-center text-muted-foreground">
              <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No preview available</p>
              <p className="text-sm">Create an HTML file to see the preview</p>
            </div>
          </div>
        )}
        
        <div className="mt-3 pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            <strong>Files:</strong> {Object.keys(project.files).length}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {Object.keys(project.files).slice(0, 3).join(', ')}
            {Object.keys(project.files).length > 3 && '...'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}