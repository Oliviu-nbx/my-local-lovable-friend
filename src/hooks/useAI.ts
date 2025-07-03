import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useProjectManager } from '@/hooks/useProjectManager';
import { useToast } from '@/hooks/use-toast';
import { ToolCall } from '@/types/tools';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: string[];
}

interface AIConfig {
  type: 'gemini' | 'openai';
  instance?: any;
  endpoint?: string;
  apiKey?: string;
}

export function useAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  const projectManager = useProjectManager();
  const { toast } = useToast();

  const getAIInstance = useCallback((): AIConfig => {
    const provider = localStorage.getItem('ai-provider') || 'gemini';
    const apiKey = localStorage.getItem('gemini-api-key') || 'AIzaSyBcRopXDUOEYmODdhYrGhW7g3uXOZYZt3M';
    
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      return { type: 'gemini', instance: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) };
    } else {
      const endpoint = localStorage.getItem('lm-studio-endpoint') || 'http://localhost:1234';
      return { type: 'openai', endpoint, apiKey: localStorage.getItem('openai-api-key') || '' };
    }
  }, []);

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

  const executeToolCall = useCallback(async (toolCall: ToolCall, projectConfig: any): Promise<string> => {
    try {
      let args;
      if (typeof toolCall.function.arguments === 'string') {
        args = JSON.parse(toolCall.function.arguments);
      } else {
        args = toolCall.function.arguments;
      }
      
      console.log('Executing tool:', toolCall.function.name, args);
      
      if (toolCall.function.name === 'create_file') {
        let projectId = projectManager.currentProject;
        if (!projectId) {
          projectId = projectManager.createProject('AI Generated Project');
          console.log('Created new project:', projectId);
        }
        
        if (projectId && args.path && args.content !== undefined) {
          console.log('Creating file:', args.path, 'in project:', projectId);
          projectManager.executeFileOperation(projectId, {
            type: 'create',
            path: args.path,
            content: args.content
          });
          return `✅ Created file: ${args.path}`;
        } else {
          console.error('Missing project ID or file data');
          return `❌ Failed to create file: missing data`;
        }
      }
      
      return `❌ Unknown tool: ${toolCall.function.name}`;
    } catch (error) {
      console.error('Tool execution error:', error);
      return `❌ Error: ${error}`;
    }
  }, [projectManager]);

  const handleGeminiResponse = useCallback(async (
    aiConfig: AIConfig,
    prompt: string,
    assistantMessageId: string
  ): Promise<{ content: string; toolCalls: ToolCall[]; toolResults: string[] }> => {
    let assistantResponse = '';
    let toolCalls: ToolCall[] = [];
    let toolResults: string[] = [];

    const result = await aiConfig.instance.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      assistantResponse += chunkText;
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: assistantResponse }
          : msg
      ));
      
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Check if response contains tool calls JSON
    if (assistantResponse.includes('"tool_calls"')) {
      try {
        let jsonStr = assistantResponse;
        const jsonMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }
        
        const parsed = JSON.parse(jsonStr);
        if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
          toolCalls = parsed.tool_calls;
          assistantResponse = parsed.content || "I've created your files!";
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: assistantResponse }
              : msg
          ));
          
          for (const toolCall of toolCalls) {
            const result = await executeToolCall(toolCall, null);
            toolResults.push(result);
          }
        }
      } catch (error) {
        console.error('JSON parsing error:', error);
      }
    }

    return { content: assistantResponse, toolCalls, toolResults };
  }, [executeToolCall, setMessages]);

  const handleLocalLLMResponse = useCallback(async (
    aiConfig: AIConfig,
    systemPrompt: string,
    messageHistory: Message[],
    userContent: string,
    assistantMessageId: string
  ): Promise<{ content: string; toolCalls: ToolCall[]; toolResults: string[] }> => {
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
            { role: 'system', content: systemPrompt },
            ...messageHistory.slice(-10).map(msg => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content
            })),
            { role: 'user', content: userContent }
          ],
          temperature: parseFloat(localStorage.getItem('temperature') || '0.7'),
          max_tokens: parseInt(localStorage.getItem('max-tokens') || '2048'),
          stream: true
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
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantResponse }
                      : msg
                  ));
                  
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
            
            for (const toolCall of toolCalls) {
              const result = await executeToolCall(toolCall, null);
              toolResults.push(result);
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
  }, [executeToolCall, setMessages]);

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
      const systemPrompt = localStorage.getItem('system-prompt') || 'You are a helpful AI development assistant with file creation capabilities. When users ask you to create websites or applications, use the available tools to create the actual files. Always create complete, working code.';
      
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
        result = await handleGeminiResponse(aiConfig, prompt, assistantMessageId);
      } else {
        result = await handleLocalLLMResponse(
          aiConfig, 
          enhancedSystemPrompt + configContext, 
          messages, 
          userMessage.content,
          assistantMessageId
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
  }, [messages, getAIInstance, simulateThinking, handleGeminiResponse, handleLocalLLMResponse, toast]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date()
    }]);
  }, []);

  const loadMessages = useCallback((projectId: string) => {
    if (projectId) {
      const chatKey = `chat-messages-${projectId}`;
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
        console.error('Failed to load chat for project:', projectId, error);
      }
    }
    
    setMessages([{
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI development assistant. I can create files and build projects. Tell me what you want to create!",
      timestamp: new Date()
    }]);
  }, []);

  const saveMessages = useCallback((projectId: string) => {
    if (projectId && messages.length > 0) {
      const chatKey = `chat-messages-${projectId}`;
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
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
    loadMessages,
    saveMessages,
    setMessages
  };
}