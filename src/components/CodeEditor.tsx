import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectFile } from '@/types/tools';
import { Save, Code, Eye, EyeOff, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Editor, { OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  file: ProjectFile | null;
  onSave?: (path: string, content: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ file, onSave, readOnly = false }: CodeEditorProps) {
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'off' | 'on'>('off');
  const editorRef = useRef<any>(null);
  const { toast } = useToast();

  // Get language from file extension for Monaco Editor
  const getLanguageFromFile = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'sql':
        return 'sql';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
      case 'c':
        return 'cpp';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'sh':
        return 'shell';
      default:
        return 'plaintext';
    }
  };

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setHasChanges(false);
    }
  }, [file]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      theme: 'vs-dark',
      fontSize: fontSize,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: readOnly,
      minimap: { enabled: true },
      wordWrap: wordWrap,
      tabSize: 2,
      insertSpaces: true,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderWhitespace: 'selection',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      contextmenu: true,
      mouseWheelZoom: true,
      automaticLayout: true,
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Set initial content
    if (file) {
      editor.setValue(file.content);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setHasChanges(newContent !== (file?.content || ''));
  };

  const handleSave = () => {
    if (!file || !onSave) return;
    
    onSave(file.path, content);
    setHasChanges(false);
    toast({
      title: "File saved",
      description: `${file.path} has been saved successfully.`
    });
  };

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(8, Math.min(24, fontSize + delta));
    setFontSize(newSize);
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize: newSize });
    }
  };

  const toggleWordWrap = () => {
    const newWrap = wordWrap === 'off' ? 'on' : 'off';
    setWordWrap(newWrap);
    if (editorRef.current) {
      editorRef.current.updateOptions({ wordWrap: newWrap });
    }
  };

  const formatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const isPreviewable = file?.path.endsWith('.html') || file?.path.endsWith('.md');

  if (!file) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No file selected</p>
            <p className="text-sm">Select a file from the explorer to edit</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-code-bg border-code-border">
      <CardHeader className="pb-3 bg-code-bg border-b border-code-border">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Code className="w-5 h-5 text-foreground" />
            <span className="font-mono text-foreground">{file.path}</span>
            {hasChanges && <span className="text-xs bg-warning text-black px-2 py-1 rounded">Modified</span>}
          </span>
          
          <div className="flex items-center gap-2">
            {/* Editor Controls */}
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustFontSize(-1)}
                className="h-6 w-6 p-0 text-xs"
                title="Decrease font size"
              >
                -
              </Button>
              <span className="text-xs px-2">{fontSize}px</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustFontSize(1)}
                className="h-6 w-6 p-0 text-xs"
                title="Increase font size"
              >
                +
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleWordWrap}
              className="text-xs"
              title={`Word wrap: ${wordWrap}`}
            >
              Wrap
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={formatDocument}
              className="gap-1"
              title="Format document (Alt+Shift+F)"
            >
              <Settings className="w-3 h-3" />
              Format
            </Button>

            {isPreviewable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            )}
            
            {!readOnly && onSave && hasChanges && (
              <Button
                onClick={handleSave}
                size="sm"
                className="gap-2"
                title="Save file (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {showPreview && isPreviewable ? (
          <div className="flex-1 border-t overflow-hidden">
            {file.path.endsWith('.html') ? (
              <iframe
                srcDoc={content}
                className="w-full h-full"
                title={`Preview of ${file.path}`}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="p-4 prose prose-sm max-w-none h-full overflow-auto bg-background">
                <pre className="whitespace-pre-wrap text-foreground">{content}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 border-t">
            <Editor
              height="100%"
              language={getLanguageFromFile(file.path)}
              value={content}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: readOnly,
                fontSize: fontSize,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                minimap: { enabled: true },
                wordWrap: wordWrap,
                tabSize: 2,
                insertSpaces: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                renderWhitespace: 'selection',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                contextmenu: true,
                mouseWheelZoom: true,
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: "active",
                  indentation: true,
                },
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                tabCompletion: "on",
                wordBasedSuggestions: "allDocuments",
                quickSuggestions: {
                  other: true,
                  comments: true,
                  strings: true
                }
              }}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-muted-foreground">Loading editor...</div>
                </div>
              }
            />
          </div>
        )}
        
        <div className="px-4 py-2 border-t text-xs text-muted-foreground flex justify-between bg-code-bg">
          <span>
            Lines: {content.split('\n').length} | 
            Characters: {content.length} | 
            Language: {getLanguageFromFile(file.path)}
          </span>
          <span>
            Last modified: {file.lastModified.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}