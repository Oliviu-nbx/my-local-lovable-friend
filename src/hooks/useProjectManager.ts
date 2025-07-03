import { useState, useCallback } from 'react';
import { ProjectState, ProjectFile, FileOperation } from '@/types/tools';

export function useProjectManager() {
  const [projects, setProjects] = useState<Record<string, ProjectState>>({});
  const [currentProject, setCurrentProject] = useState<string | null>(null);

  const createProject = useCallback((name: string) => {
    const projectId = Date.now().toString();
    const newProject: ProjectState = {
      name,
      files: {},
      previewUrl: undefined
    };
    
    setProjects(prev => ({
      ...prev,
      [projectId]: newProject
    }));
    
    setCurrentProject(projectId);
    return projectId;
  }, []);

  const executeFileOperation = useCallback((projectId: string, operation: FileOperation) => {
    setProjects(prev => {
      const project = prev[projectId];
      if (!project) return prev;

      const updatedFiles = { ...project.files };
      
      switch (operation.type) {
        case 'create':
        case 'update':
          if (operation.content !== undefined) {
            updatedFiles[operation.path] = {
              path: operation.path,
              content: operation.content,
              lastModified: new Date(),
              type: 'file'
            };
          }
          break;
        case 'delete':
          delete updatedFiles[operation.path];
          break;
      }

      // Update preview URL if it's an HTML file
      let previewUrl = project.previewUrl;
      if (operation.path.endsWith('.html') && operation.type !== 'delete') {
        const blob = new Blob([operation.content || ''], { type: 'text/html' });
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        previewUrl = URL.createObjectURL(blob);
      }

      return {
        ...prev,
        [projectId]: {
          ...project,
          files: updatedFiles,
          previewUrl
        }
      };
    });
  }, []);

  const getProject = useCallback((projectId: string) => {
    return projects[projectId];
  }, [projects]);

  const getCurrentProject = useCallback(() => {
    return currentProject ? projects[currentProject] : null;
  }, [currentProject, projects]);

  return {
    projects,
    currentProject,
    createProject,
    executeFileOperation,
    getProject,
    getCurrentProject,
    setCurrentProject
  };
}