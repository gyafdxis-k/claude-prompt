// 本地文件服务协议定义

export interface ToolRequest {
  id: string; // 请求唯一 ID
  tool: string; // 工具名称
  parameters: Record<string, any>; // 工具参数
}

export interface ToolResponse {
  id: string; // 对应请求 ID
  success: boolean;
  data?: any;
  error?: string;
}

// 支持的工具类型
export type ToolName = 
  | 'read_file'
  | 'write_file' 
  | 'edit_file'
  | 'list_files'
  | 'run_command';

// 各工具的参数定义
export interface ReadFileParams {
  path: string;
  encoding?: string;
}

export interface WriteFileParams {
  path: string;
  content: string;
  encoding?: string;
}

export interface EditFileParams {
  path: string;
  old_string: string;
  new_string: string;
}

export interface ListFilesParams {
  pattern: string;
  cwd?: string;
}

export interface RunCommandParams {
  command: string;
  cwd?: string;
  timeout?: number;
}

// WebSocket 消息类型
export interface WSMessage {
  type: 'tool_request' | 'tool_response' | 'ping' | 'pong' | 'error';
  payload?: any;
}
