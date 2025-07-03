import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Copy, RotateCcw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useProjectManager } from "@/hooks/useProjectManager";
import { availableTools, executeToolCall, formatToolsForAI } from "@/services/aiTools";
import { ToolCall } from "@/types/tools";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: string[];
}

export function ChatInterface() {
  const projectManager = useProjectManager();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI development assistant with file creation capabilities. I can build complete websites and applications for you. Just tell me what you want to create and I'll build it with working files and show you the preview!\n\nTry asking me to create something like:\n• \"Make a simple website with hero section, 3 services, and contact form\"\n• \"Create a todo app with React\"\n• \"Build a landing page for a restaurant\"",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize AI instance
  const getAIInstance = () => {
    const provider = localStorage.getItem('ai-provider') || 'gemini';
    const apiKey = localStorage.getItem('gemini-api-key') || 'AIzaSyBcRopXDUOEYmODdhYrGhW7g3uXOZYZt3M';
    
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      return { type: 'gemini', instance: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) };
    } else {
      const endpoint = localStorage.getItem('lm-studio-endpoint') || 'http://localhost:1234';
      return { type: 'openai', endpoint, apiKey: localStorage.getItem('openai-api-key') || '' };
    }
  };

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
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiConfig = getAIInstance();
      const systemPrompt = localStorage.getItem('system-prompt') || 'You are a helpful AI development assistant with file creation capabilities. When users ask you to create websites or applications, use the available tools to create the actual files. Always create complete, working code.';
      
      // Add tool information to system prompt for Gemini
      const enhancedSystemPrompt = `${systemPrompt}

When users ask you to create websites, apps, or files, you MUST respond with this exact JSON format:

{
  "tool_calls": [
    {
      "id": "call_1", 
      "type": "function",
      "function": {
        "name": "create_file",
        "arguments": "{\"path\": \"index.html\", \"content\": \"<!DOCTYPE html>...\"}"
      }
    }
  ],
  "content": "I've created your website!"
}

Available tools: create_file, update_file, delete_file, create_project. Always create complete working HTML files with inline CSS.`;
      
      // Create context from recent messages
      const context = messages.slice(-10).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      
      let assistantResponse = '';
      let toolCalls: ToolCall[] = [];
      let toolResults: string[] = [];

      if (aiConfig.type === 'gemini') {
        const prompt = `${enhancedSystemPrompt}\n\nConversation history:\n${context}\n\nUser: ${userMessage.content}\n\nAssistant:`;
        const result = await aiConfig.instance.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        // Check if response contains tool calls JSON
        if (responseText.includes('"tool_calls"')) {
          try {
            // Extract JSON from response (handle both ```json and direct JSON)
            let jsonStr = responseText;
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
            
            const parsed = JSON.parse(jsonStr);
            if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
              toolCalls = parsed.tool_calls;
              assistantResponse = parsed.content || "I've created your files!";
              
              // Execute each tool call
              for (const toolCall of toolCalls) {
                try {
                  // Safer argument parsing for escaped content
                  let args;
                  if (typeof toolCall.function.arguments === 'string') {
                    // Use eval in a safe context for complex escaped JSON
                    args = Function('"use strict"; return (' + toolCall.function.arguments + ')')();
                  } else {
                    args = toolCall.function.arguments;
                  }
                  
                  const result = executeToolCall(
                    toolCall.function.name,
                    args,
                    (operation) => {
                      if (projectManager.currentProject) {
                        projectManager.executeFileOperation(projectManager.currentProject, operation);
                      } else {
                        const projectId = projectManager.createProject('New Project');
                        projectManager.executeFileOperation(projectId, operation);
                      }
                    },
                    (name) => projectManager.createProject(name)
                  );
                  toolResults.push(result);
                } catch (error) {
                  console.error('Tool execution error:', error);
                  toolResults.push(`Error: ${error}`);
                }
              }
            } else {
              assistantResponse = responseText;
            }
          } catch (error) {
            console.error('JSON parsing error:', error);
            assistantResponse = responseText;
          }
        } else {
          assistantResponse = responseText;
        }
      } else {
        // OpenAI-compatible API (LM Studio)
        const response = await fetch(`${aiConfig.endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(aiConfig.apiKey && { 'Authorization': `Bearer ${aiConfig.apiKey}` })
          },
          body: JSON.stringify({
            model: localStorage.getItem('local-model-name') || 'local-model',
            messages: [
              { role: 'system', content: enhancedSystemPrompt },
              ...messages.slice(-10).map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
              })),
              { role: 'user', content: userMessage.content }
            ],
            temperature: parseFloat(localStorage.getItem('temperature') || '0.7'),
            max_tokens: parseInt(localStorage.getItem('max-tokens') || '2048'),
            tools: availableTools,
            tool_choice: 'auto'
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const choice = data.choices[0];
        
        assistantResponse = choice.message?.content || 'I\'m working on your request...';
        
        if (choice.message?.tool_calls) {
          toolCalls = choice.message.tool_calls;
          
          // Execute tool calls
          for (const toolCall of toolCalls) {
            const args = JSON.parse(toolCall.function.arguments);
            const result = executeToolCall(
              toolCall.function.name,
              args,
              (operation) => {
                if (projectManager.currentProject) {
                  projectManager.executeFileOperation(projectManager.currentProject, operation);
                } else {
                  // Create a new project if none exists
                  const projectId = projectManager.createProject('New Project');
                  projectManager.executeFileOperation(projectId, operation);
                }
              },
              (name) => projectManager.createProject(name)
            );
            toolResults.push(result);
          }
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        toolResults: toolResults.length > 0 ? toolResults : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI API Error:', error);
      const provider = localStorage.getItem('ai-provider') || 'gemini';
      toast({
        title: "Error",
        description: `Failed to get response from ${provider === 'gemini' ? 'Gemini' : 'Local AI'}. Check your configuration in Settings.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard"
    });
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-chat-bg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Chat</h2>
          <p className="text-sm text-muted-foreground">Conversation with your local LLM</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Clear Chat
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-gradient-primary text-primary-foreground shadow-glow'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <Card className={`max-w-[80%] p-4 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-card border-code-border'
              }`}>
                <div className="prose prose-invert max-w-none">
                  <p className="mb-0 whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Tool calls indicator */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Wrench className="w-3 h-3" />
                      <span>Used {message.toolCalls.length} tool(s)</span>
                    </div>
                    {message.toolResults && (
                      <div className="mt-2 text-xs bg-muted/20 rounded p-2">
                        {message.toolResults.map((result, idx) => (
                          <div key={idx} className="text-green-600">{result}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyMessage(message.content)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <Card className="bg-card border-code-border p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about development..."
              className="min-h-[60px] resize-none bg-background border-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="self-end bg-gradient-primary hover:shadow-glow transition-spring"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}