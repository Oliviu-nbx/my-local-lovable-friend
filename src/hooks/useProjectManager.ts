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
            // Create directories for nested paths
            const pathParts = operation.path.split('/');
            if (pathParts.length > 1) {
              // Create parent directories
              for (let i = 1; i < pathParts.length; i++) {
                const dirPath = pathParts.slice(0, i).join('/');
                if (dirPath && !updatedFiles[dirPath]) {
                  updatedFiles[dirPath] = {
                    path: dirPath,
                    content: '',
                    lastModified: new Date(),
                    type: 'directory'
                  };
                  console.log('Created directory:', dirPath);
                }
              }
            }
            
            // Create/update the file
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
          // Delete file and any empty parent directories
          delete updatedFiles[operation.path];
          console.log('Deleted file:', operation.path);
          
          // Check if we should clean up empty directories
          const pathParts = operation.path.split('/');
          if (pathParts.length > 1) {
            for (let i = pathParts.length - 2; i >= 1; i--) {
              const dirPath = pathParts.slice(0, i).join('/');
              const hasChildren = Object.keys(updatedFiles).some(path => 
                path !== dirPath && path.startsWith(dirPath + '/')
              );
              if (!hasChildren && updatedFiles[dirPath]?.type === 'directory') {
                delete updatedFiles[dirPath];
                console.log('Deleted empty directory:', dirPath);
              } else {
                break; // Stop if directory is not empty
              }
            }
          }
          break;
      }

      // Update preview URL for HTML files
      let previewUrl = project.previewUrl;
      const htmlFiles = Object.values(updatedFiles).filter(file => 
        file.type === 'file' && file.path.endsWith('.html')
      );
      
      if (htmlFiles.length > 0) {
        // Find the main HTML file (index.html or first .html file)
        const mainHtmlFile = htmlFiles.find(file => 
          file.path === 'index.html' || file.path.endsWith('/index.html')
        ) || htmlFiles[0];
        
        if (mainHtmlFile) {
          // Clean up old URL
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
          
          // Create new preview URL with all files
          let htmlContent = mainHtmlFile.content || '';
          
          // Inject other files as inline resources for better preview
          const cssFiles = Object.values(updatedFiles).filter(file => 
            file.type === 'file' && file.path.endsWith('.css')
          );
          const jsFiles = Object.values(updatedFiles).filter(file => 
            file.type === 'file' && file.path.endsWith('.js')
          );
          
          // Inject CSS files
          cssFiles.forEach(cssFile => {
            const styleTag = `<style>/* ${cssFile.path} */\n${cssFile.content}\n</style>`;
            if (htmlContent.includes('</head>')) {
              htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
            } else {
              htmlContent = `${styleTag}\n${htmlContent}`;
            }
          });
          
          // Inject JS files
          jsFiles.forEach(jsFile => {
            const scriptTag = `<script>/* ${jsFile.path} */\n${jsFile.content}\n</script>`;
            if (htmlContent.includes('</body>')) {
              htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
            } else {
              htmlContent = `${htmlContent}\n${scriptTag}`;
            }
          });
          
          const blob = new Blob([htmlContent], { type: 'text/html' });
          previewUrl = URL.createObjectURL(blob);
          console.log('Updated preview URL for project with', htmlFiles.length, 'HTML file(s)');
        }
      } else if (operation.type === 'delete' && operation.path.endsWith('.html')) {
        // Clean up preview URL if the last HTML file was deleted
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          previewUrl = undefined;
          console.log('Removed preview URL - no HTML files remaining');
        }
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

  const createDirectory = useCallback((projectId: string, dirPath: string) => {
    console.log('Creating directory:', dirPath, 'in project:', projectId);
    
    setProjects(prev => {
      const project = prev[projectId];
      if (!project) {
        console.error('Project not found:', projectId);
        return prev;
      }

      const updatedFiles = { ...project.files };
      
      // Create all parent directories if they don't exist
      const pathParts = dirPath.split('/').filter(part => part.length > 0);
      for (let i = 1; i <= pathParts.length; i++) {
        const currentPath = pathParts.slice(0, i).join('/');
        if (!updatedFiles[currentPath]) {
          updatedFiles[currentPath] = {
            path: currentPath,
            content: '',
            lastModified: new Date(),
            type: 'directory'
          };
          console.log('Created directory:', currentPath);
        }
      }

      return {
        ...prev,
        [projectId]: {
          ...project,
          files: updatedFiles
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
    createDirectory,
    getProject,
    getCurrentProject,
    setCurrentProject,
    getAllProjects,
    deleteProject
  };
}