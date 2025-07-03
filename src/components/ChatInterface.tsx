import { useState, useEffect } from "react";
import { RotateCcw, Settings, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectManager } from "@/hooks/useProjectManager";
import { ProjectConfigDialog } from "@/components/ProjectConfigDialog";
import { CloneWebsiteDialog } from "@/components/CloneWebsiteDialog";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useAI, Message } from "@/hooks/useAI";
import { useToast } from "@/hooks/use-toast";
import { ToolCall } from "@/types/tools";

export function ChatInterface() {
  const projectManager = useProjectManager();
  const [showThinking, setShowThinking] = useState(false);
  const [showProjectConfig, setShowProjectConfig] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [projectConfig, setProjectConfig] = useState<any>(null);
  const { toast } = useToast();
  const currentProject = projectManager.getCurrentProject();
  const currentProjectId = projectManager.currentProject;

  const {
    messages,
    isLoading,
    isStreaming,
    currentStreamingMessageId,
    thinkingSteps,
    progress,
    sendMessage,
    clearMessages,
    loadMessages,
    saveMessages
  } = useAI();

  // Load messages for current project
  useEffect(() => {
    if (currentProjectId) {
      loadMessages(currentProjectId);
    }
  }, [currentProjectId, loadMessages]);

  // Save messages whenever they change
  useEffect(() => {
    if (currentProjectId) {
      saveMessages(currentProjectId);
    }
  }, [messages, currentProjectId, saveMessages]);

  const handleSendMessage = (content: string) => {
    sendMessage(content, projectConfig);
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
                  
                  // This streaming is now handled by useAI hook
                  
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
    clearMessages();
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
      sendMessage(prompt, projectConfig);
    } else {
      // Show prompt for local AI
      const cloneMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed the website at ${url} and generated this prompt for you. Would you like me to use this to create a similar website?\n\n---\n\n${prompt}`,
        timestamp: new Date()
      };
      // This would be handled by the useAI hook
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
      <MessageList
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        currentStreamingMessageId={currentStreamingMessageId}
        thinkingSteps={thinkingSteps}
        progress={progress}
        showThinking={showThinking}
        onToggleThinking={() => setShowThinking(!showThinking)}
      />

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
      />
      
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