import { useState, useCallback } from 'react';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/ai';
import { getAIInstance, getSystemPrompt } from '@/services/aiConfigService';
import { handleGeminiResponse, handleLocalLLMResponse } from '@/services/aiResponseHandlers';
import { loadMessages, saveMessages, getDefaultMessages } from '@/services/chatPersistence';

export function useAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const projectManager = useProjectManager();
  const { toast } = useToast();

  const simulateThinking = useCallback(async () => {
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
  }, []);

  const sendMessage = useCallback(async (content: string, projectConfig?: any) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
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
    
    const thinkingPromise = simulateThinking();

    try {
      const aiConfig = getAIInstance();
      const enhancedSystemPrompt = getSystemPrompt();
      
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
      
      let result;
      if (aiConfig.type === 'gemini') {
        const prompt = `${enhancedSystemPrompt}\n\n${configContext}\n\nConversation history:\n${context}\n\nUser: ${userMessage.content}\n\nAssistant:`;
        result = await handleGeminiResponse(aiConfig, prompt, assistantMessageId, projectManager, setMessages);
      } else {
        result = await handleLocalLLMResponse(
          aiConfig, 
          enhancedSystemPrompt + configContext, 
          messages, 
          userMessage.content,
          assistantMessageId,
          projectManager,
          setMessages
        );
      }
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: result.content,
              toolCalls: result.toolCalls.length > 0 ? result.toolCalls : undefined,
              toolResults: result.toolResults.length > 0 ? result.toolResults : undefined
            }
          : msg
      ));
      
    } catch (error) {
      console.error('AI API Error:', error);
      const provider = localStorage.getItem('ai-provider') || 'gemini';
      
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
  }, [messages, simulateThinking, projectManager, toast]);

  const clearMessages = useCallback(() => {
    setMessages(getDefaultMessages());
  }, []);

  const loadMessagesForProject = useCallback((projectId: string) => {
    const loadedMessages = loadMessages(projectId);
    setMessages(loadedMessages);
  }, []);

  const saveMessagesForProject = useCallback((projectId: string) => {
    saveMessages(projectId, messages);
  }, [messages]);

  return {
    messages,
    isLoading,
    isStreaming,
    currentStreamingMessageId,
    thinkingSteps,
    progress,
    sendMessage,
    clearMessages,
    loadMessages: loadMessagesForProject,
    saveMessages: saveMessagesForProject,
    setMessages
  };
}

export type { Message };