import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useProjectManager } from '@/hooks/useProjectManager';
import { 
  MessageSquare, 
  FolderOpen, 
  Settings, 
  Code2, 
  Terminal,
  FileText,
  Cpu,
  Hammer,
  Plus,
  FolderPlus,
  Search,
  Palette,
  Globe,
  Users,
  File,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFile?: (path: string) => void;
  onCreateDirectory?: (path: string) => void;
  onDeleteFile?: (path: string) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'project' | 'file' | 'ai' | 'settings';
  keywords?: string[];
}

export function CommandPalette({ 
  open, 
  onOpenChange, 
  onCreateFile, 
  onCreateDirectory,
  onDeleteFile 
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const projectManager = useProjectManager();
  
  const currentProject = projectManager.getCurrentProject();
  const allProjects = projectManager.getAllProjects();

  // Reset search when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  // Navigation commands
  const navigationCommands: CommandItem[] = [
    {
      id: 'nav-chat',
      label: 'Go to Chat',
      description: 'AI Chat interface',
      icon: <MessageSquare className="w-4 h-4" />,
      action: () => {
        navigate('/');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['chat', 'ai', 'assistant', 'talk']
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      description: 'Manage your projects',
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => {
        navigate('/projects');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['projects', 'manage', 'list']
    },
    {
      id: 'nav-workspace',
      label: 'Go to Workspace',
      description: 'Development workspace',
      icon: <Code2 className="w-4 h-4" />,
      action: () => {
        navigate('/workspace');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['workspace', 'development', 'code', 'editor']
    },
    {
      id: 'nav-development',
      label: 'Go to Development',
      description: 'User management and tools',
      icon: <Hammer className="w-4 h-4" />,
      action: () => {
        navigate('/development');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['development', 'users', 'tools', 'manage']
    },
    {
      id: 'nav-files',
      label: 'Go to Files',
      description: 'File management',
      icon: <FileText className="w-4 h-4" />,
      action: () => {
        navigate('/files');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['files', 'browse', 'manage']
    },
    {
      id: 'nav-editor',
      label: 'Go to Editor',
      description: 'Code editor',
      icon: <Code2 className="w-4 h-4" />,
      action: () => {
        navigate('/editor');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['editor', 'code', 'edit', 'monaco']
    },
    {
      id: 'nav-terminal',
      label: 'Go to Terminal',
      description: 'Terminal interface',
      icon: <Terminal className="w-4 h-4" />,
      action: () => {
        navigate('/terminal');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['terminal', 'console', 'command']
    },
    {
      id: 'nav-model',
      label: 'Go to Model Status',
      description: 'AI model information',
      icon: <Cpu className="w-4 h-4" />,
      action: () => {
        navigate('/model');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['model', 'ai', 'status', 'info']
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      description: 'Application settings',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        navigate('/settings');
        onOpenChange(false);
      },
      category: 'navigation',
      keywords: ['settings', 'preferences', 'config', 'configuration']
    }
  ];

  // Project commands
  const projectCommands: CommandItem[] = [
    {
      id: 'create-project',
      label: 'Create New Project',
      description: 'Start a new project',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        const name = prompt('Enter project name:');
        if (name?.trim()) {
          projectManager.createProject(name.trim());
          onOpenChange(false);
        }
      },
      category: 'project',
      keywords: ['create', 'new', 'project', 'start']
    },
    ...allProjects.map(project => ({
      id: `switch-project-${project.id}`,
      label: `Switch to "${project.name}"`,
      description: `Switch to project ${project.name}`,
      icon: <FolderOpen className="w-4 h-4" />,
      action: () => {
        projectManager.setCurrentProject(project.id);
        onOpenChange(false);
      },
      category: 'project' as const,
      keywords: ['switch', 'project', project.name.toLowerCase()]
    }))
  ];

  // File commands (only show if we have a current project)
  const fileCommands: CommandItem[] = currentProject ? [
    {
      id: 'create-file',
      label: 'Create New File',
      description: 'Create a new file in current project',
      icon: <File className="w-4 h-4" />,
      action: () => {
        const path = prompt('Enter file path (e.g., src/components/App.jsx):');
        if (path?.trim()) {
          onCreateFile?.(path.trim());
          onOpenChange(false);
        }
      },
      category: 'file',
      keywords: ['create', 'new', 'file', 'add']
    },
    {
      id: 'create-directory',
      label: 'Create New Directory',
      description: 'Create a new directory in current project',
      icon: <FolderPlus className="w-4 h-4" />,
      action: () => {
        const path = prompt('Enter directory path (e.g., src/components):');
        if (path?.trim()) {
          onCreateDirectory?.(path.trim());
          onOpenChange(false);
        }
      },
      category: 'file',
      keywords: ['create', 'new', 'directory', 'folder', 'add']
    },
    ...Object.keys(currentProject.files)
      .filter(path => currentProject.files[path].type === 'file')
      .slice(0, 10) // Limit to first 10 files to avoid clutter
      .map(filePath => ({
        id: `open-file-${filePath}`,
        label: `Open ${filePath}`,
        description: `Open file ${filePath}`,
        icon: <File className="w-4 h-4" />,
        action: () => {
          // Navigate to workspace and select file
          navigate('/workspace');
          // This would need to be handled by the parent component
          onOpenChange(false);
        },
        category: 'file' as const,
        keywords: ['open', 'file', filePath.toLowerCase()]
      }))
  ] : [];

  // AI commands
  const aiCommands: CommandItem[] = [
    {
      id: 'ai-configure',
      label: 'Configure AI Project',
      description: 'Set up project configuration for AI',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        // This would trigger the project config dialog
        onOpenChange(false);
      },
      category: 'ai',
      keywords: ['configure', 'ai', 'project', 'setup', 'config']
    },
    {
      id: 'ai-clone-website',
      label: 'Clone Website',
      description: 'Clone an existing website with AI',
      icon: <Globe className="w-4 h-4" />,
      action: () => {
        // This would trigger the clone website dialog
        onOpenChange(false);
      },
      category: 'ai',
      keywords: ['clone', 'website', 'copy', 'ai', 'analyze']
    }
  ];

  // Settings commands
  const settingsCommands: CommandItem[] = [
    {
      id: 'settings-ai',
      label: 'AI Settings',
      description: 'Configure AI provider and settings',
      icon: <Cpu className="w-4 h-4" />,
      action: () => {
        navigate('/settings');
        onOpenChange(false);
      },
      category: 'settings',
      keywords: ['settings', 'ai', 'provider', 'api', 'key']
    },
    {
      id: 'settings-theme',
      label: 'Theme Settings',
      description: 'Customize appearance',
      icon: <Palette className="w-4 h-4" />,
      action: () => {
        navigate('/settings');
        onOpenChange(false);
      },
      category: 'settings',
      keywords: ['theme', 'appearance', 'dark', 'light', 'colors']
    },
    {
      id: 'user-management',
      label: 'User Management',
      description: 'Manage users and authentication',
      icon: <Users className="w-4 h-4" />,
      action: () => {
        navigate('/development');
        onOpenChange(false);
      },
      category: 'settings',
      keywords: ['users', 'management', 'auth', 'login', 'admin']
    }
  ];

  const allCommands = [
    ...navigationCommands,
    ...projectCommands,
    ...fileCommands,
    ...aiCommands,
    ...settingsCommands
  ];

  // Filter commands based on search
  const filteredCommands = search 
    ? allCommands.filter(command => 
        command.label.toLowerCase().includes(search.toLowerCase()) ||
        command.description?.toLowerCase().includes(search.toLowerCase()) ||
        command.keywords?.some(keyword => keyword.includes(search.toLowerCase()))
      )
    : allCommands;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const categoryLabels = {
    navigation: 'Navigation',
    project: 'Projects',
    file: 'Files',
    ai: 'AI Tools',
    settings: 'Settings'
  };

  const categoryOrder = ['navigation', 'project', 'file', 'ai', 'settings'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <Command.List className="max-h-[400px] overflow-y-auto">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No commands found.
            </Command.Empty>
            
            {categoryOrder.map(category => {
              const commands = groupedCommands[category];
              if (!commands || commands.length === 0) return null;
              
              return (
                <Command.Group key={category} heading={categoryLabels[category]}>
                  {commands.map(command => (
                    <Command.Item
                      key={command.id}
                      value={command.label}
                      onSelect={command.action}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      {command.icon}
                      <div className="flex-1">
                        <div className="font-medium">{command.label}</div>
                        {command.description && (
                          <div className="text-sm text-muted-foreground">
                            {command.description}
                          </div>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
          
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            Tip: Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}