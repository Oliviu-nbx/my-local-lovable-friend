import { useState } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
  isLoading: boolean;
  isStreaming: boolean;
}

export function ChatInput({ onSendMessage, onStopGeneration, isLoading, isStreaming }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading || isStreaming) return;
    
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about development..."
            className="min-h-[60px] resize-none bg-background border-input"
            onKeyDown={handleKeyDown}
          />
          {isStreaming ? (
            <Button
              onClick={onStopGeneration}
              variant="destructive"
              className="self-end"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="self-end bg-gradient-primary hover:shadow-glow transition-spring"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
          {isStreaming && <span className="text-primary"> • Streaming response...</span>}
        </p>
      </div>
    </div>
  );
}