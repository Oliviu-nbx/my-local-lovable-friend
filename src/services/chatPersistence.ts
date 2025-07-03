import { Message } from '@/types/ai';

export const loadMessages = (projectId: string): Message[] => {
  if (projectId) {
    const chatKey = `chat-messages-${projectId}`;
    try {
      const saved = localStorage.getItem(chatKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load chat for project:', projectId, error);
    }
  }
  
  return [{
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your AI development assistant. I can create files and build projects. Tell me what you want to create!",
    timestamp: new Date()
  }];
};

export const saveMessages = (projectId: string, messages: Message[]): void => {
  if (projectId && messages.length > 0) {
    const chatKey = `chat-messages-${projectId}`;
    localStorage.setItem(chatKey, JSON.stringify(messages));
  }
};

export const getDefaultMessages = (): Message[] => {
  return [{
    id: '1',
    role: 'assistant',
    content: 'Chat cleared. How can I help you today?',
    timestamp: new Date()
  }];
};