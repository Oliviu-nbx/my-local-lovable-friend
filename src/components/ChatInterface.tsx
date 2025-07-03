import { useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectManager } from "@/hooks/useProjectManager";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useAI } from "@/hooks/useAI";
import { Message } from "@/types/ai";
import { useToast } from "@/hooks/use-toast";
import { ToolCall } from "@/types/tools";

export function ChatInterface() {
  const projectManager = useProjectManager();
  const [showThinking, setShowThinking] = useState(false);
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
    sendMessage(content);
  };

  const clearChat = () => {
    clearMessages();
  };

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
    </div>
  );
}