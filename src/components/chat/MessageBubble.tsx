import { Copy, User, Bot, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/hooks/useAI";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isCurrentStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming, isCurrentStreaming }: MessageBubbleProps) {
  const { toast } = useToast();

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard"
    });
  };

  return (
    <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
      } ${isStreaming && isCurrentStreaming ? 'border-primary/50 shadow-primary/10' : ''}`}>
        <div className="prose prose-invert max-w-none">
          <p className="mb-0 whitespace-pre-wrap">
            {message.content}
            {isStreaming && isCurrentStreaming && (
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
                  <div key={idx} className="text-success">{result}</div>
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
  );
}