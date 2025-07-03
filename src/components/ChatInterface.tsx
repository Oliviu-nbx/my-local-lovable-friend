import { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Copy, RotateCcw, Wrench, Eye, EyeOff, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useProjectManager } from "@/hooks/useProjectManager";
import { availableTools, executeToolCall, formatToolsForAI } from "@/services/aiTools";
import { ToolCall } from "@/types/tools";
import { ProjectConfigDialog } from "@/components/ProjectConfigDialog";
import { CloneWebsiteDialog } from "@/components/CloneWebsiteDialog";

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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [showProjectConfig, setShowProjectConfig] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [projectConfig, setProjectConfig] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const currentProject = projectManager.getCurrentProject();
  const currentProjectId = projectManager.currentProject;

  // Project-specific chat storage
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages for current project
  useEffect(() => {
    if (currentProjectId) {
      const chatKey = `chat-messages-${currentProjectId}`;
      try {
        const saved = localStorage.getItem(chatKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setMessages(parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
          return;
        }
      } catch (error) {
        console.error('Failed to load chat for project:', currentProjectId, error);
      }
    }
    
    // Default welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI development assistant. I can create files and build projects. Tell me what you want to create!",
      timestamp: new Date()
    }]);
  }, [currentProjectId]);

  // Save messages whenever they change
  useEffect(() => {
    if (currentProjectId && messages.length > 0) {
      const chatKey = `chat-messages-${currentProjectId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  }, [messages, currentProjectId]);

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

  const simulateThinking = async () => {
    const steps = [
      "Analyzing your request...",
      "Understanding the context...",
      "Planning the implementation...",
      "Generating code structure...",
      "Optimizing the solution...",
      "Finalizing the response..."
    ];
    
    setThinkingSteps([]);
    setProgress(0);
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      setThinkingSteps(prev => [...prev, steps[i]]);
      setProgress((i + 1) / steps.length * 100);
    }
  };

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
    setShowThinking(false);
    
    // Create placeholder message for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, placeholderMessage]);
    setCurrentStreamingMessageId(assistantMessageId);
    setIsStreaming(true);
    
    // Start thinking simulation
    const thinkingPromise = simulateThinking();

    try {
      const aiConfig = getAIInstance();
      const systemPrompt = localStorage.getItem('system-prompt') || 'You are a helpful AI development assistant with file creation capabilities. When users ask you to create websites or applications, use the available tools to create the actual files. Always create complete, working code.';
      
      // Add tool information to system prompt for Gemini
      const enhancedSystemPrompt = `${systemPrompt}

When users ask you to create websites or files, respond with JSON using this EXACT format:

{
  "tool_calls": [
    {
      "id": "call_1",
      "type": "function", 
      "function": {
        "name": "create_file",
        "arguments": {
          "path": "index.html",
          "content": "simple HTML content here without quotes or escapes"
        }
      }
    }
  ],
  "content": "I've created your website!"
}

IMPORTANT: Put the arguments as an object, NOT a string. Keep HTML content simple without complex escaping.`;
      
      // Create context from recent messages and project config
      const context = messages.slice(-10).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      
      const configContext = projectConfig ? `
Project Configuration:
- Business Type: ${projectConfig.businessType}
- Website Name: ${projectConfig.websiteName}
- Description: ${projectConfig.description}
- Preferred Colors: ${projectConfig.preferredColors}
- Reference Images: ${projectConfig.images?.length || 0} uploaded
` : '';
      
      let assistantResponse = '';
      let toolCalls: ToolCall[] = [];
      let toolResults: string[] = [];

      if (aiConfig.type === 'gemini') {
        const prompt = `${enhancedSystemPrompt}\n\n${configContext}\n\nConversation history:\n${context}\n\nUser: ${userMessage.content}\n\nAssistant:`;
        
        // Use streaming for Gemini
        const result = await aiConfig.instance.generateContentStream(prompt);
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          assistantResponse += chunkText;
          
          // Update the streaming message in real-time
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: assistantResponse }
              : msg
          ));
          
          // Small delay to make streaming visible
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Check if response contains tool calls JSON after streaming is complete
        if (assistantResponse.includes('"tool_calls"')) {
          try {
            // Extract JSON from response (handle both ```json and direct JSON)
            let jsonStr = assistantResponse;
            const jsonMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonStr = jsonMatch[1];
            }
            
            const parsed = JSON.parse(jsonStr);
            if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
              toolCalls = parsed.tool_calls;
              assistantResponse = parsed.content || "I've created your files!";
              
              // Update message with clean content
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: assistantResponse }
                  : msg
              ));
              
              // Execute each tool call
              for (const toolCall of toolCalls) {
                try {
                  // Parse arguments if they're a string
                  let args;
                  if (typeof toolCall.function.arguments === 'string') {
                    args = JSON.parse(toolCall.function.arguments);
                  } else {
                    args = toolCall.function.arguments;
                  }
                  
                  console.log('Executing tool:', toolCall.function.name, args);
                  
                  if (toolCall.function.name === 'create_file') {
                    // Create project if none exists
                    let projectId = projectManager.currentProject;
                    if (!projectId) {
                      projectId = projectManager.createProject('AI Generated Project');
                      console.log('Created new project:', projectId);
                    }
                    
                    // Create the file
                    if (projectId && args.path && args.content !== undefined) {
                      console.log('Creating file:', args.path, 'in project:', projectId);
                      projectManager.executeFileOperation(projectId, {
                        type: 'create',
                        path: args.path,
                        content: args.content
                      });
                      toolResults.push(`✅ Created file: ${args.path}`);
                    } else {
                      console.error('Missing project ID or file data');
                      toolResults.push(`❌ Failed to create file: missing data`);
                    }
                  }
                } catch (error) {
                  console.error('Tool execution error:', error);
                  toolResults.push(`❌ Error: ${error}`);
                }
              }
            }
          } catch (error) {
            console.error('JSON parsing error:', error);
            // Keep the streamed response as-is
          }
        }
      } else {
        // For local LLMs, try to implement streaming
        const localResponse = await handleLocalLLMStreamingResponse(
          aiConfig, 
          enhancedSystemPrompt, 
          context, 
          configContext, 
          userMessage.content,
          assistantMessageId
        );
        assistantResponse = localResponse.content;
        toolCalls = localResponse.toolCalls;
        toolResults = localResponse.toolResults;
      }
      
      // Update final message with tool calls if any
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: assistantResponse,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              toolResults: toolResults.length > 0 ? toolResults : undefined
            }
          : msg
      ));
      
    } catch (error) {
      console.error('AI API Error:', error);
      const provider = localStorage.getItem('ai-provider') || 'gemini';
      
      // Update the placeholder message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `Error: Failed to get response from ${provider === 'gemini' ? 'Gemini' : 'Local AI'}. Please check your configuration.` }
          : msg
      ));
      
      toast({
        title: "Error",
        description: `Failed to get response from ${provider === 'gemini' ? 'Gemini' : 'Local AI'}. Check your configuration in Settings.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStreamingMessageId(null);
    }
  };

  // New function to handle local LLM streaming
  const handleLocalLLMStreamingResponse = async (
    aiConfig: any, 
    systemPrompt: string, 
    context: string, 
    configContext: string, 
    userContent: string,
    messageId: string
  ) => {
    try {
      const response = await fetch(`${aiConfig.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiConfig.apiKey && { 'Authorization': `Bearer ${aiConfig.apiKey}` })
        },
        body: JSON.stringify({
          model: localStorage.getItem('local-model-name') || 'local-model',
          messages: [
            { role: 'system', content: systemPrompt + configContext },
            ...messages.slice(-10).map(msg => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content
            })),
            { role: 'user', content: userContent }
          ],
          temperature: parseFloat(localStorage.getItem('temperature') || '0.7'),
          max_tokens: parseInt(localStorage.getItem('max-tokens') || '2048'),
          stream: true // Enable streaming
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let assistantResponse = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantResponse += content;
                  
                  // Update the streaming message
                  setMessages(prev => prev.map(msg => 
                    msg.id === messageId 
                      ? { ...msg, content: assistantResponse }
                      : msg
                  ));
                  
                  // Small delay for visual streaming effect
                  await new Promise(resolve => setTimeout(resolve, 20));
                }
              } catch (e) {
                // Ignore parsing errors for individual chunks
              }
            }
          }
        }
      }

      // Try to parse tool calls from the response
      let toolCalls: ToolCall[] = [];
      let toolResults: string[] = [];
      let content = assistantResponse;

      // Check if response contains JSON tool calls
      if (assistantResponse.includes('"tool_calls"') || assistantResponse.includes('create_file')) {
        try {
          let jsonStr = assistantResponse;
          const jsonMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
          
          const parsed = JSON.parse(jsonStr);
          if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
            toolCalls = parsed.tool_calls;
            content = parsed.content || "I've created your files!";
            
            // Execute tool calls
            for (const toolCall of toolCalls) {
              try {
                let args;
                if (typeof toolCall.function.arguments === 'string') {
                  args = JSON.parse(toolCall.function.arguments);
                } else {
                  args = toolCall.function.arguments;
                }
                
                if (toolCall.function.name === 'create_file') {
                  let projectId = projectManager.currentProject;
                  if (!projectId) {
                    projectId = projectManager.createProject(projectConfig?.websiteName || 'AI Generated Project');
                  }
                  
                  if (projectId && args.path && args.content !== undefined) {
                    projectManager.executeFileOperation(projectId, {
                      type: 'create',
                      path: args.path,
                      content: args.content
                    });
                    toolResults.push(`✅ Created file: ${args.path}`);
                  }
                }
              } catch (error) {
                console.error('Tool execution error:', error);
                toolResults.push(`❌ Error: ${error}`);
              }
            }
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
        }
      }

      return { content, toolCalls, toolResults };
    } catch (error) {
      console.error('Local LLM streaming error:', error);
      return { 
        content: 'Error communicating with local AI. Please check your configuration.',
        toolCalls: [],
        toolResults: []
      };
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

  const handleLocalLLMResponse = async (aiConfig: any, systemPrompt: string, context: string, configContext: string, userContent: string) => {
    try {
      const response = await fetch(`${aiConfig.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(aiConfig.apiKey && { 'Authorization': `Bearer ${aiConfig.apiKey}` })
        },
        body: JSON.stringify({
          model: localStorage.getItem('local-model-name') || 'local-model',
          messages: [
            { role: 'system', content: systemPrompt + configContext },
            ...messages.slice(-10).map(msg => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content
            })),
            { role: 'user', content: userContent }
          ],
          temperature: parseFloat(localStorage.getItem('temperature') || '0.7'),
          max_tokens: parseInt(localStorage.getItem('max-tokens') || '2048'),
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const responseText = choice.message?.content || 'I\'m working on your request...';
      
      // Try to parse tool calls from the response
      let toolCalls: ToolCall[] = [];
      let toolResults: string[] = [];
      let content = responseText;

      // Check if response contains JSON tool calls
      if (responseText.includes('"tool_calls"') || responseText.includes('create_file')) {
        try {
          let jsonStr = responseText;
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
          
          const parsed = JSON.parse(jsonStr);
          if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
            toolCalls = parsed.tool_calls;
            content = parsed.content || "I've created your files!";
            
            // Execute tool calls
            for (const toolCall of toolCalls) {
              try {
                let args;
                if (typeof toolCall.function.arguments === 'string') {
                  args = JSON.parse(toolCall.function.arguments);
                } else {
                  args = toolCall.function.arguments;
                }
                
                if (toolCall.function.name === 'create_file') {
                  let projectId = projectManager.currentProject;
                  if (!projectId) {
                    projectId = projectManager.createProject(projectConfig?.websiteName || 'AI Generated Project');
                  }
                  
                  if (projectId && args.path && args.content !== undefined) {
                    projectManager.executeFileOperation(projectId, {
                      type: 'create',
                      path: args.path,
                      content: args.content
                    });
                    toolResults.push(`✅ Created file: ${args.path}`);
                  }
                }
              } catch (error) {
                console.error('Tool execution error:', error);
                toolResults.push(`❌ Error: ${error}`);
              }
            }
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
        }
      }

      return { content, toolCalls, toolResults };
    } catch (error) {
      console.error('Local LLM error:', error);
      return { 
        content: 'Error communicating with local AI. Please check your configuration.',
        toolCalls: [],
        toolResults: []
      };
    }
  };

  const handleProjectConfigSubmit = (config: any) => {
    setProjectConfig(config);
    localStorage.setItem(`project-config-${currentProjectId}`, JSON.stringify(config));
    toast({
      title: "Configuration saved",
      description: "Project configuration has been set. The AI will use this information for better results."
    });
  };

  const handleCloneWebsite = (prompt: string, url: string) => {
    const provider = localStorage.getItem('ai-provider') || 'gemini';
    
    if (provider === 'gemini') {
      // Auto-send prompt for Gemini
      setInput(prompt);
      setTimeout(() => sendMessage(), 100);
    } else {
      // Show prompt for local AI
      const cloneMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed the website at ${url} and generated this prompt for you. Would you like me to use this to create a similar website?\n\n---\n\n${prompt}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, cloneMessage]);
    }
  };

  // Load project config
  useEffect(() => {
    if (currentProjectId) {
      const saved = localStorage.getItem(`project-config-${currentProjectId}`);
      if (saved) {
        try {
          setProjectConfig(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load project config:', error);
        }
      } else {
        setProjectConfig(null);
      }
    }
  }, [currentProjectId]);

  return (
    <div className="flex flex-col h-full bg-chat-bg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div>
          <h2 className="text-lg font-semibold text-foreground">AI Chat</h2>
          <p className="text-sm text-muted-foreground">
            {currentProject ? `Project: ${currentProject.name}` : 'No project selected'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProjectConfig(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Configure
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCloneDialog(true)}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            Clone Website
          </Button>
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
              } ${isStreaming && message.id === currentStreamingMessageId ? 'border-primary/50 shadow-primary/10' : ''}`}>
                <div className="prose prose-invert max-w-none">
                  <p className="mb-0 whitespace-pre-wrap">
                    {message.content}
                    {isStreaming && message.id === currentStreamingMessageId && (
                      <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse">|</span>
                    )}
                  </p>
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
              <Card className="bg-card border-code-border p-4 min-w-[300px]">
                <div className="space-y-3">
                  {/* Header with thinking dots and toggle button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowThinking(!showThinking)}
                      className="h-6 w-6 p-0"
                      title={showThinking ? "Hide thinking process" : "Show thinking process"}
                    >
                      {showThinking ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {Math.round(progress)}% complete
                    </div>
                  </div>
                  
                  {/* Thinking steps (only shown when toggled) */}
                  {showThinking && thinkingSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <div className="text-xs text-muted-foreground mb-2">AI Thinking Process:</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {thinkingSteps.map((step, idx) => (
                          <div key={idx} className="text-xs bg-muted/20 rounded p-2 animate-fade-in">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              disabled={!input.trim() || isLoading || isStreaming}
              className="self-end bg-gradient-primary hover:shadow-glow transition-spring"
            >
              {isStreaming ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
            {isStreaming && <span className="text-primary"> • Streaming response...</span>}
          </p>
        </div>
      </div>
      
      <ProjectConfigDialog
        open={showProjectConfig}
        onOpenChange={setShowProjectConfig}
        onSubmit={handleProjectConfigSubmit}
      />
      
      <CloneWebsiteDialog
        open={showCloneDialog}
        onOpenChange={setShowCloneDialog}
        onPromptGenerated={handleCloneWebsite}
      />
    </div>
  );
}