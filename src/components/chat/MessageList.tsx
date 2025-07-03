import { useRef, useEffect } from "react";
import { Bot, Eye, EyeOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageBubble } from "./MessageBubble";
import { Message } from "@/types/ai";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  currentStreamingMessageId: string | null;
  thinkingSteps: string[];
  progress: number;
  showThinking: boolean;
  onToggleThinking: () => void;
}

export function MessageList({
  messages,
  isLoading,
  isStreaming,
  currentStreamingMessageId,
  thinkingSteps,
  progress,
  showThinking,
  onToggleThinking
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    // Use setTimeout to ensure DOM is updated
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages, isLoading, isStreaming]);

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming}
            isCurrentStreaming={message.id === currentStreamingMessageId}
          />
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
                    onClick={onToggleThinking}
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
  );
}