import { useState, useCallback, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
  toolResults?: string[];
  projectId?: string;
}

const CHAT_STORAGE_KEY = 'ai-dev-chat-history';

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedChat = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    } else {
      // Set initial welcome message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm your AI development assistant with file creation capabilities. I can build complete websites and applications for you. Just tell me what you want to create and I'll build it with working files and show you the preview!\n\nTry asking me to create something like:\n• \"Make a simple website with hero section, 3 services, and contact form\"\n• \"Create a todo app with React\"\n• \"Build a landing page for a restaurant\"",
        timestamp: new Date()
      }]);
    }
  }, []);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      projectId: currentProjectId || undefined
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [currentProjectId]);

  const clearChat = useCallback(() => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const getProjectMessages = useCallback((projectId: string) => {
    return messages.filter(msg => msg.projectId === projectId);
  }, [messages]);

  return {
    messages,
    addMessage,
    clearChat,
    getProjectMessages,
    setCurrentProjectId
  };
}