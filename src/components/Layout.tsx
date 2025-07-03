import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { useCommandPalette } from "@/hooks/useKeyboardShortcut";
import { useCommandPaletteContext } from "@/contexts/CommandPaletteContext";
import { useProjectManager } from "@/hooks/useProjectManager";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Global Header */}
          <header className="h-14 border-b border-border bg-card flex items-center px-4 shadow-soft">
            <SidebarTrigger className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 transition-smooth" />
            
            <div className="ml-4 flex-1">
              <h1 className="text-sm font-medium text-foreground">AI Development Assistant</h1>
            </div>
            
            {/* Command Palette Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={openCommandPalette}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search commands</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            
            <div className="flex items-center gap-2 ml-4">
              <div className="text-xs text-muted-foreground">
                {(() => {
                  const provider = localStorage.getItem('ai-provider') || 'gemini';
                  if (provider === 'lmstudio') {
                    const modelName = localStorage.getItem('local-model-name') || 'Local LLM';
                    return `${modelName} Connected`;
                  }
                  return 'Gemini AI Connected';
                })()}
              </div>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 bg-background">
            {children}
          </main>
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        open={isOpen}
        onOpenChange={closeCommandPalette}
        onCreateFile={handleCreateFile}
        onCreateDirectory={handleCreateDirectory}
        onDeleteFile={handleDeleteFile}
      />
    </SidebarProvider>
  );
}