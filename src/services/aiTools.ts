import { ToolDefinition, FileOperation } from '@/types/tools';

export const availableTools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'create_file',
      description: 'Create a new file with specified content',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path (e.g., src/App.js, index.html)'
          },
          content: {
            type: 'string',
            description: 'The content of the file'
          }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_file',
      description: 'Update an existing file with new content',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path to update'
          },
          content: {
            type: 'string',
            description: 'The new content of the file'
          }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The file path to delete'
          }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Create a new project with a specific name',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the project'
          },
          type: {
            type: 'string',
            description: 'The type of project (website, react-app, etc.)',
            enum: ['website', 'react-app', 'landing-page']
          }
        },
        required: ['name', 'type']
      }
    }
  }
];

export function executeToolCall(
  toolName: string,
  args: any,
  onFileOperation: (operation: FileOperation) => void,
  onProjectCreate: (name: string) => string
): string {
  try {
    switch (toolName) {
      case 'create_file':
        onFileOperation({
          type: 'create',
          path: args.path,
          content: args.content
        });
        return `Created file: ${args.path}`;

      case 'update_file':
        onFileOperation({
          type: 'update',
          path: args.path,
          content: args.content
        });
        return `Updated file: ${args.path}`;

      case 'delete_file':
        onFileOperation({
          type: 'delete',
          path: args.path
        });
        return `Deleted file: ${args.path}`;

      case 'create_project':
        const projectId = onProjectCreate(args.name);
        return `Created project: ${args.name} (ID: ${projectId})`;

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    return `Error executing ${toolName}: ${error}`;
  }
}

export function formatToolsForAI(): string {
  return `You have access to the following tools to create and manage files:

${availableTools.map(tool => 
  `- ${tool.function.name}: ${tool.function.description}
    Parameters: ${JSON.stringify(tool.function.parameters.properties, null, 2)}`
).join('\n\n')}

To use a tool, respond with a JSON object in this format:
{
  "tool_calls": [
    {
      "id": "call_1",
      "type": "function",
      "function": {
        "name": "tool_name",
        "arguments": "{\"param1\": \"value1\", \"param2\": \"value2\"}"
      }
    }
  ],
  "content": "Your explanation of what you're doing"
}

Always create complete, working files. For websites, start with an index.html file and include all necessary CSS and JavaScript inline or in separate files.`;
}