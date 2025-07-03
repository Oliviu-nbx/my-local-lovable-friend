import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {localStorage.getItem('ai-provider') === 'lmstudio' ? 'Local AI Connected' : 'Gemini AI Connected'}
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
    </SidebarProvider>
  );
}