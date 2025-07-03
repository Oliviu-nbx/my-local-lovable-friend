import { useState } from "react";
import { Play, Save, FileText, Code, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useProjectManager } from "@/hooks/useProjectManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Editor() {
  const [activeTab, setActiveTab] = useState("editor");
  const projectManager = useProjectManager();
  const allProjects = projectManager.getAllProjects();
  const [code, setCode] = useState(`// Welcome to AI Dev Editor
// This is a simple code editor with AI assistance

function greetUser(name: string): string {
  return \`Hello, \${name}! Welcome to your AI development assistant.\`;
}

// Try asking the AI to help you write code
const message = greetUser("Developer");
console.log(message);

// You can use the chat to:
// - Get code suggestions
// - Debug issues
// - Learn new concepts
// - Refactor existing code
`);

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "File saved",
      description: "Your code has been saved successfully"
    });
  };

  const handleRun = () => {
    toast({
      title: "Code executed",
      description: "Check the console for output"
    });
    
    // In a real implementation, this would execute the code
    console.log("Executing code:", code);
  };

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Editor Header */}
        <div className="flex items-center justify-between p-4 border-b border-code-border bg-code-bg">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Code Editor</h2>
              <p className="text-sm text-muted-foreground">Write and edit your code with AI assistance</p>
            </div>
            <div className="w-64">
              <Select value={projectManager.currentProject || ""} onValueChange={projectManager.setCurrentProject}>
                <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {allProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button size="sm" onClick={handleRun} className="gap-2 bg-gradient-primary hover:shadow-glow">
              <Play className="w-4 h-4" />
              Run
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-code-bg border-b border-code-border rounded-none">
              <TabsTrigger value="editor" className="gap-2 text-foreground">
                <Code className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 text-foreground">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 m-0">
              <div className="h-full bg-editor-bg">
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-full resize-none border-0 bg-code-bg text-foreground font-mono text-sm p-4"
                  placeholder="Start writing your code here..."
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 m-0">
              <div className="h-full bg-editor-bg">
                <Card className="h-full bg-code-bg border-code-border">
                  <div className="flex items-center gap-2 p-4 border-b border-code-border">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Code Preview</h3>
                  </div>
                  <pre className="text-sm p-4 overflow-auto h-full">
                    <code className="text-foreground font-mono">{code}</code>
                  </pre>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Status Bar */}
        <div className="border-t border-code-border bg-code-bg px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4 font-mono">
              <span>TypeScript</span>
              <span>Line 1, Column 1</span>
              <span>{code.split('\n').length} lines</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success"></div>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Editor;