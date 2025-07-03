import { useState, useCallback, useEffect } from 'react';
import { ProjectState, ProjectFile, FileOperation } from '@/types/tools';

const STORAGE_KEY = 'ai-dev-projects';
const CURRENT_PROJECT_KEY = 'ai-dev-current-project';

export function useProjectManager() {
  const [projects, setProjects] = useState<Record<string, ProjectState>>({});
  const [currentProject, setCurrentProject] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      const savedCurrentProject = localStorage.getItem(CURRENT_PROJECT_KEY);
      
      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        // Convert date strings back to Date objects
        Object.values(parsed).forEach((project: any) => {
          Object.values(project.files || {}).forEach((file: any) => {
            if (file.lastModified) {
              file.lastModified = new Date(file.lastModified);
            }
          });
        });
        setProjects(parsed);
        console.log('Loaded projects:', Object.keys(parsed));
      }
      
      if (savedCurrentProject && savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (parsed[savedCurrentProject]) {
          setCurrentProject(savedCurrentProject);
          console.log('Set current project:', savedCurrentProject);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  }, []);

  // Save to localStorage whenever projects change
  useEffect(() => {
    if (Object.keys(projects).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      console.log('Saved projects:', Object.keys(projects));
    }
  }, [projects]);

  // Save current project whenever it changes
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem(CURRENT_PROJECT_KEY, currentProject);
      console.log('Saved current project:', currentProject);
    }
  }, [currentProject]);

  const createProject = useCallback((name: string) => {
    const projectId = Date.now().toString();
    const newProject: ProjectState = {
      name,
      files: {},
      previewUrl: undefined
    };
    
    console.log('Creating project:', name, 'with ID:', projectId);
    
    setProjects(prev => {
      const updated = {
        ...prev,
        [projectId]: newProject
      };
      console.log('Updated projects:', Object.keys(updated));
      return updated;
    });
    
    setCurrentProject(projectId);
    return projectId;
  }, []);

  const executeFileOperation = useCallback((projectId: string, operation: FileOperation) => {
    console.log('Executing file operation:', operation.type, operation.path, 'in project:', projectId);
    
    setProjects(prev => {
      const project = prev[projectId];
      if (!project) {
        console.error('Project not found:', projectId);
        return prev;
      }

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
            console.log('Created/updated file:', operation.path);
          }
          break;
        case 'delete':
          delete updatedFiles[operation.path];
          console.log('Deleted file:', operation.path);
          break;
      }

      // Update preview URL if it's an HTML file
      let previewUrl = project.previewUrl;
      if (operation.path.endsWith('.html') && operation.type !== 'delete') {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        const blob = new Blob([operation.content || ''], { type: 'text/html' });
        previewUrl = URL.createObjectURL(blob);
        console.log('Created preview URL for:', operation.path);
      }

      const updatedProject = {
        ...project,
        files: updatedFiles,
        previewUrl
      };

      console.log('Project now has files:', Object.keys(updatedFiles));

      return {
        ...prev,
        [projectId]: updatedProject
      };
    });
  }, []);

  const getProject = useCallback((projectId: string) => {
    return projects[projectId];
  }, [projects]);

  const getCurrentProject = useCallback(() => {
    return currentProject ? projects[currentProject] : null;
  }, [currentProject, projects]);

  const getAllProjects = useCallback(() => {
    return Object.entries(projects).map(([id, project]) => ({
      id,
      ...project
    }));
  }, [projects]);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => {
      const updated = { ...prev };
      delete updated[projectId];
      return updated;
    });
    
    if (currentProject === projectId) {
      setCurrentProject(null);
    }
  }, [currentProject]);

  return {
    projects,
    currentProject,
    createProject,
    executeFileOperation,
    getProject,
    getCurrentProject,
    setCurrentProject,
    getAllProjects,
    deleteProject
  };
}