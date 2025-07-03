import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  MessageSquare, 
  FolderOpen, 
  Settings, 
  Code2, 
  Terminal,
  FileText,
  Cpu,
  Zap,
  Hammer,
  Menu,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCommandPaletteContext } from "@/contexts/CommandPaletteContext";
import { useIsMobile } from "@/hooks/use-mobile";

const navigationItems = [
  { title: "Chat", url: "/", icon: MessageSquare },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Workspace", url: "/workspace", icon: Code2 },
  { title: "Development", url: "/development", icon: Hammer },
  { title: "Files", url: "/files", icon: FileText },
  { title: "Editor", url: "/editor", icon: Code2 },
  { title: "Terminal", url: "/terminal", icon: Terminal },
];

const toolItems = [
  { title: "Model Status", url: "/model", icon: Cpu },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openCommandPalette } = useCommandPaletteContext();
  const isMobile = useIsMobile();

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
      isActive 
        ? "bg-primary text-primary-foreground shadow-glow" 
        : "text-muted-foreground hover:text-foreground hover:bg-accent"
    }`;

  const MobileNavContent = () => (
    <div className="flex flex-col space-y-4 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">AI Dev</h2>
          <p className="text-xs text-muted-foreground">Local Assistant</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Workspace</h3>
        {navigationItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={getNavClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            <item.icon className="w-4 h-4" />
            {item.title}
          </NavLink>
        ))}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Tools</h3>
        {toolItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={getNavClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            <item.icon className="w-4 h-4" />
            {item.title}
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-soft">
      <div className="container flex h-14 items-center px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">AI Dev Assistant</h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 flex-1">
          {navigationItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={getNavClass}
            >
              <item.icon className="w-4 h-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Command Palette Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={openCommandPalette}
            className="gap-2 text-muted-foreground hover:text-foreground hidden sm:flex"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* AI Status */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {(() => {
                const provider = localStorage.getItem('ai-provider') || 'gemini';
                if (provider === 'lmstudio') {
                  const modelName = localStorage.getItem('local-model-name') || 'Local LLM';
                  return modelName;
                }
                return 'Gemini AI';
              })()}
            </div>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          </div>

          {/* Mobile Menu */}
          {isMobile && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <MobileNavContent />
              </SheetContent>
            </Sheet>
          )}

          {/* Settings Link (Desktop) */}
          <NavLink
            to="/settings"
            className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-smooth"
          >
            <Settings className="w-4 h-4" />
          </NavLink>
        </div>
      </div>
    </header>
  );
}