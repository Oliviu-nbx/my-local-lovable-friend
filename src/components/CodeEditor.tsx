import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProjectFile } from '@/types/tools';
import { Save, Code, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css';
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';

// Register languages
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('xml', xml);
SyntaxHighlighter.registerLanguage('json', json);

interface CodeEditorProps {
  file: ProjectFile | null;
  onSave?: (path: string, content: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ file, onSave, readOnly = false }: CodeEditorProps) {
  const [content, setContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSyntaxHighlight, setShowSyntaxHighlight] = useState(true);
  const { toast } = useToast();

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
        return 'xml';
      case 'json':
        return 'json';
      default:
        return 'javascript';
    }
  };

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setHasChanges(false);
    }
  }, [file]);

  const handleSave = () => {
    if (!file || !onSave) return;
    
    onSave(file.path, content);
    setHasChanges(false);
    toast({
      title: "File saved",
      description: `${file.path} has been saved successfully.`
    });
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(value !== (file?.content || ''));
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSyntaxHighlight(!showSyntaxHighlight)}
              className="gap-2"
            >
              <Code className="w-4 h-4" />
              {showSyntaxHighlight ? 'Plain' : 'Highlight'}
            </Button>
            
            {!readOnly && onSave && hasChanges && (
              <Button
                onClick={handleSave}
                size="sm"
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        {showPreview && isPreviewable ? (
          <div className="flex-1 border rounded-md overflow-hidden">
            {file.path.endsWith('.html') ? (
              <iframe
                srcDoc={content}
                className="w-full h-full"
                title={`Preview of ${file.path}`}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="p-4 prose prose-sm max-w-none h-full overflow-auto">
                <pre className="whitespace-pre-wrap">{content}</pre>
              </div>
            )}
          </div>
        ) : showSyntaxHighlight && !readOnly ? (
          <div className="flex-1 relative">
            <SyntaxHighlighter
              language={getLanguageFromFile(file.path)}
              style={vs2015}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'hsl(var(--code-bg))',
                color: 'hsl(var(--foreground))',
                fontSize: '14px',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                height: '100%',
                overflow: 'auto'
              }}
              showLineNumbers={true}
              lineNumberStyle={{
                color: 'hsl(var(--muted-foreground))',
                paddingRight: '1rem',
                minWidth: '3rem'
              }}
            >
              {content}
            </SyntaxHighlighter>
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="absolute inset-0 font-mono text-sm resize-none border-0 p-4 bg-transparent text-transparent caret-white outline-none"
              placeholder=""
              style={{ 
                lineHeight: '1.5',
                tabSize: 2,
                whiteSpace: 'pre'
              }}
            />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="flex-1 font-mono text-sm resize-none border-0 p-4 bg-code-bg text-foreground"
            placeholder="Enter your code here..."
            readOnly={readOnly}
            style={{ 
              lineHeight: '1.5',
              tabSize: 2,
              whiteSpace: 'pre'
            }}
          />
        )}
        
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex justify-between">
          <span>
            Lines: {content.split('\n').length} | 
            Characters: {content.length}
          </span>
          <span>
            Last modified: {file.lastModified.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}