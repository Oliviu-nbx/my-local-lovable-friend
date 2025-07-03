import { ToolCall } from './tools';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: string[];
}

export interface AIConfig {
  type: 'gemini' | 'openai';
  instance?: any;
  endpoint?: string;
  apiKey?: string;
}

export interface AIResponse {
  content: string;
  toolCalls: ToolCall[];
  toolResults: string[];
}