import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIConfig } from '@/types/ai';

export const getAIInstance = (): AIConfig => {
  const provider = localStorage.getItem('ai-provider') || 'gemini';
  const apiKey = localStorage.getItem('gemini-api-key') || 'AIzaSyBcRopXDUOEYmODdhYrGhW7g3uXOZYZt3M';
  
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey);
    return { type: 'gemini', instance: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) };
  } else {
    const endpoint = localStorage.getItem('lm-studio-endpoint') || 'http://localhost:1234';
    return { type: 'openai', endpoint, apiKey: localStorage.getItem('openai-api-key') || '' };
  }
};

export const getSystemPrompt = (): string => {
  const systemPrompt = localStorage.getItem('system-prompt') || 'You are a helpful AI development assistant with file creation capabilities. When users ask you to create websites or applications, use the available tools to create the actual files. Always create complete, working code.';
  
  return `${systemPrompt}

You are a specialized AI assistant for web development. Your primary function is to create and modify files using the provided tools.

When a user asks you to create a website, application, or files, you MUST immediately respond with a JSON object containing the necessary 'create_file' tool calls. Do NOT ask for clarifying details or engage in conversation. Be creative and generate the complete file content based on the user's request.

Your response MUST be ONLY the JSON object in the following format:
{
  "tool_calls": [
    {
      "id": "call_1",
      "type": "function",
      "function": {
        "name": "create_file",
        "arguments": {
          "path": "index.html",
          "content": "Your complete and well-structured HTML content here. Do not use complex escaping."
        }
      }
    },
    {
      "id": "call_2",
      "type": "function",
      "function": {
        "name": "create_file",
        "arguments": {
          "path": "styles.css",
          "content": "Your complete CSS styles here."
        }
      }
    }
  ],
  "content": "I have created the files for your project."
}

IMPORTANT:
- Never ask for the name of the bakery or other details. Invent creative and appropriate content yourself.
- Always use the 'create_file' tool when asked to build or create something.
- The 'arguments' field in the JSON must be a nested object, not a string.
- Respond only with the JSON object. Do not wrap it in markdown or add any other text.`;
};