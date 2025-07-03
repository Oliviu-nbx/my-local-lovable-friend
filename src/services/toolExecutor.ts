import { ToolCall } from '@/types/tools';

export const executeToolCall = async (
  toolCall: ToolCall, 
  projectManager: any,
  projectConfig?: any
): Promise<string> => {
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
};