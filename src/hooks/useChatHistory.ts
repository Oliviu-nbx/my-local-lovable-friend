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

export function useChatHistory(projectId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load chat history from localStorage for specific project
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    const savedChats = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedChats) {
      try {
        const allChats = JSON.parse(savedChats);
        const projectChat = allChats[projectId] || [];
        // Convert timestamp strings back to Date objects
        const messagesWithDates = projectChat.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setMessages([getWelcomeMessage()]);
      }
    } else {
      // Set initial welcome message for new project
      setMessages([getWelcomeMessage()]);
    }
  }, [projectId]);

  const getWelcomeMessage = (): ChatMessage => ({
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your AI development assistant with file creation capabilities. I can build complete websites and applications for you. Just tell me what you want to create and I'll build it with working files and show you the preview!\n\nTry asking me to create something like:\n• \"Make a simple website with hero section, 3 services, and contact form\"\n• \"Create a todo app with React\"\n• \"Build a landing page for a restaurant\"",
    timestamp: new Date(),
    projectId
  });

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0 && projectId) {
      const savedChats = localStorage.getItem(CHAT_STORAGE_KEY);
      const allChats = savedChats ? JSON.parse(savedChats) : {};
      allChats[projectId] = messages;
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(allChats));
    }
  }, [messages, projectId]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      projectId
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [projectId]);

  const clearChat = useCallback(() => {
    const welcomeMessage = getWelcomeMessage();
    setMessages([welcomeMessage]);
  }, [projectId]);

  const getProjectMessages = useCallback((targetProjectId: string) => {
    return messages.filter(msg => msg.projectId === targetProjectId);
  }, [messages]);

  return {
    messages,
    addMessage,
    clearChat,
    getProjectMessages
  };
}