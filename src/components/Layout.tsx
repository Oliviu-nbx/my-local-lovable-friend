import { CommandPalette } from "@/components/CommandPalette";
import { useCommandPalette } from "@/hooks/useKeyboardShortcut";
import { useCommandPaletteContext } from "@/contexts/CommandPaletteContext";
import { useProjectManager } from "@/hooks/useProjectManager";
import { Header } from "@/components/Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isOpen, openCommandPalette, closeCommandPalette } = useCommandPaletteContext();
  const projectManager = useProjectManager();

  // Global keyboard shortcut for command palette (Ctrl/Cmd + K)
  useCommandPalette(() => {
    openCommandPalette();
  });

  const handleCreateFile = (path: string) => {
    if (projectManager.currentProject) {
      // Navigate to workspace if not already there
      window.location.hash = '#/workspace';
      // This would need to trigger file creation in the workspace
      // For now, we'll just log it
      console.log('Create file:', path);
    }
  };

  const handleCreateDirectory = (path: string) => {
    if (projectManager.currentProject) {
      projectManager.createDirectory(projectManager.currentProject, path);
    }
  };

  const handleDeleteFile = (path: string) => {
    if (projectManager.currentProject) {
      projectManager.executeFileOperation(projectManager.currentProject, {
        type: 'delete',
        path
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="bg-background pt-0">
        {children}
      </main>

      {/* Global Command Palette */}
      <CommandPalette
        open={isOpen}
        onOpenChange={closeCommandPalette}
        onCreateFile={handleCreateFile}
        onCreateDirectory={handleCreateDirectory}
        onDeleteFile={handleDeleteFile}
      />
    </div>
  );
}