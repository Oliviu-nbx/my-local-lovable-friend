import { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Send, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";

interface TerminalEntry {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

export function Terminal() {
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      id: '1',
      type: 'output',
      content: 'AI Dev Terminal v1.0.0\nType "help" for available commands.',
      timestamp: new Date()
    }
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    const commandEntry: TerminalEntry = {
      id: Date.now().toString(),
      type: 'command',
      content: command,
      timestamp: new Date()
    };

    setHistory(prev => [...prev, commandEntry]);
    setCurrentCommand('');

    // Simulate command execution
    let output = '';
    let isError = false;

    switch (command.trim().toLowerCase()) {
      case 'help':
        output = `Available commands:
  help          - Show this help message
  clear         - Clear terminal history
  status        - Show system status
  npm install   - Install dependencies
  npm run dev   - Start development server
  git status    - Show git status
  ls            - List directory contents
  pwd           - Show current directory`;
        break;
      
      case 'clear':
        setHistory([commandEntry]);
        return;
      
      case 'status':
        output = `System Status:
  LLM Status: ✅ Connected
  Node.js: v18.17.0
  npm: v9.6.7
  Git: v2.41.0
  Current Project: AI Dev Assistant`;
        break;
      
      case 'pwd':
        output = '/home/user/projects/ai-dev-assistant';
        break;
      
      case 'ls':
        output = `src/
public/
node_modules/
package.json
README.md
tailwind.config.ts
vite.config.ts`;
        break;
      
      case 'npm run dev':
        output = `> ai-dev-assistant@1.0.0 dev
> vite

  VITE v4.4.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help`;
        break;
      
      case 'git status':
        output = `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/components/ChatInterface.tsx
        modified:   src/pages/Settings.tsx

no changes added to commit (use "git add ." or "git commit -a")`;
        break;
      
      default:
        output = `Command not found: ${command}
Type "help" for available commands.`;
        isError = true;
    }

    // Add output to history
    setTimeout(() => {
      const outputEntry: TerminalEntry = {
        id: (Date.now() + 1).toString(),
        type: isError ? 'error' : 'output',
        content: output,
        timestamp: new Date()
      };
      setHistory(prev => [...prev, outputEntry]);
    }, 500);
  };

  const clearTerminal = () => {
    setHistory([{
      id: Date.now().toString(),
      type: 'output',
      content: 'Terminal cleared.',
      timestamp: new Date()
    }]);
  };

  return (
    <Layout>
      <div className="h-full flex flex-col bg-editor-bg">
        {/* Terminal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Terminal</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearTerminal}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 p-6">
          <Card className="h-full bg-code-bg border-code-border font-mono text-sm">
            <ScrollArea ref={scrollAreaRef} className="h-full p-4">
              <div className="space-y-2">
                {history.map((entry) => (
                  <div key={entry.id} className="flex">
                    {entry.type === 'command' && (
                      <div className="flex w-full">
                        <span className="text-primary mr-2">$</span>
                        <span className="text-foreground">{entry.content}</span>
                      </div>
                    )}
                    {entry.type === 'output' && (
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {entry.content}
                      </div>
                    )}
                    {entry.type === 'error' && (
                      <div className="text-destructive whitespace-pre-wrap">
                        {entry.content}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Current command line */}
                <div className="flex items-center">
                  <span className="text-primary mr-2">$</span>
                  <Input
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        executeCommand(currentCommand);
                      }
                    }}
                    className="flex-1 border-0 bg-transparent p-0 h-auto text-foreground font-mono focus-visible:ring-0"
                    placeholder="Type a command..."
                    autoFocus
                  />
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Status Bar */}
        <div className="border-t border-border bg-card px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Ready - Type commands to interact with your development environment
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span>Terminal Active</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Terminal;