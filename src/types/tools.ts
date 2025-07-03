export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface FileOperation {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
}

export interface ProjectFile {
  path: string;
  content: string;
  lastModified: Date;
  type: 'file' | 'directory';
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  file?: ProjectFile;
}

export interface ProjectState {
  name: string;
  files: Record<string, ProjectFile>;
  activeFile?: string;
  previewUrl?: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  };
}