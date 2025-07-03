import { AIConfig, AIResponse, Message } from '@/types/ai';
import { ToolCall } from '@/types/tools';
import { executeToolCall } from './toolExecutor';

export const handleGeminiResponse = async (
  aiConfig: AIConfig,
  prompt: string,
  assistantMessageId: string,
  projectManager: any,
  setMessages: (updater: (prev: Message[]) => Message[]) => void
): Promise<AIResponse> => {
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
  
  // Check if response contains tool calls JSON - try different JSON patterns
  if (assistantResponse.includes('"tool_calls"') || assistantResponse.includes('create_file')) {
    try {
      let jsonStr = assistantResponse;
      
      // Try to extract JSON from markdown code blocks first
      const markdownJsonMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownJsonMatch) {
        jsonStr = markdownJsonMatch[1];
      } else {
        // Try to find JSON object in the response
        const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      console.log('Attempting to parse JSON:', jsonStr);
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
        console.log('Found tool calls:', parsed.tool_calls);
        toolCalls = parsed.tool_calls;
        assistantResponse = parsed.content || "I've created your files!";
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantResponse }
            : msg
        ));
        
        for (const toolCall of toolCalls) {
          console.log('Executing tool call:', toolCall);
          const result = await executeToolCall(toolCall, projectManager, null);
          console.log('Tool execution result:', result);
          toolResults.push(result);
        }
      }
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.log('Failed to parse response:', assistantResponse);
    }
  }

  return { content: assistantResponse, toolCalls, toolResults };
};

export const handleLocalLLMResponse = async (
  aiConfig: AIConfig,
  systemPrompt: string,
  messageHistory: Message[],
  userContent: string,
  assistantMessageId: string,
  projectManager: any,
  setMessages: (updater: (prev: Message[]) => Message[]) => void
): Promise<AIResponse> => {
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
        
        // Try to extract JSON from markdown code blocks first
        const markdownJsonMatch = assistantResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownJsonMatch) {
          jsonStr = markdownJsonMatch[1];
        } else {
          // Try to find JSON object in the response
          const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
        }
        
        console.log('Local LLM attempting to parse JSON:', jsonStr);
        const parsed = JSON.parse(jsonStr);
        
        if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
          console.log('Local LLM found tool calls:', parsed.tool_calls);
          toolCalls = parsed.tool_calls;
          content = parsed.content || "I've created your files!";
          
          for (const toolCall of toolCalls) {
            console.log('Local LLM executing tool call:', toolCall);
            const result = await executeToolCall(toolCall, projectManager, null);
            console.log('Local LLM tool execution result:', result);
            toolResults.push(result);
          }
        }
      } catch (error) {
        console.error('Local LLM JSON parsing error:', error);
        console.log('Local LLM failed to parse response:', assistantResponse);
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
};