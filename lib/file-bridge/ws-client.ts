/**
 * WebSocket 客户端 - 连接本地文件服务
 */

interface ToolRequest {
  id: string;
  tool: string;
  parameters: Record<string, any>;
}

interface ToolResponse {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface WSMessage {
  type: 'request' | 'response';
  payload: ToolRequest | ToolResponse;
}

export class FileServiceClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, {
    resolve: (response: ToolResponse) => void;
    reject: (error: Error) => void;
  }>();
  
  constructor(private url: string = 'ws://localhost:8765') {}
  
  /**
   * 连接到本地文件服务
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('[FileService] Connected to local file service');
          resolve();
        };
        
        this.ws.onerror = (error) => {
          console.error('[FileService] Connection error:', error);
          reject(new Error('Failed to connect to local file service'));
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        
        this.ws.onclose = () => {
          console.log('[FileService] Connection closed');
          this.scheduleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 断开连接
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  /**
   * 自动重连
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    this.reconnectTimer = setTimeout(() => {
      console.log('[FileService] Attempting to reconnect...');
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // 重连失败，继续尝试
      });
    }, 5000);
  }
  
  /**
   * 处理服务器消息
   */
  private handleMessage(data: string) {
    try {
      const message: WSMessage = JSON.parse(data);
      
      if (message.type === 'tool_response') {
        const response = message.payload as ToolResponse;
        const pending = this.pendingRequests.get(response.id);
        
        if (pending) {
          this.pendingRequests.delete(response.id);
          
          if (response.success) {
            pending.resolve(response);
          } else {
            pending.reject(new Error(response.error || 'Unknown error'));
          }
        }
      }
    } catch (error) {
      console.error('[FileService] Failed to parse message:', error);
    }
  }
  
  /**
   * 发送请求
   */
  private async sendRequest(request: ToolRequest): Promise<ToolResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to file service');
    }
    
    return new Promise((resolve, reject) => {
      const requestId = `req-${++this.requestId}`;
      request.id = requestId;
      
      this.pendingRequests.set(requestId, { resolve, reject });
      
      const message: WSMessage = {
        type: 'tool_request',
        payload: request
      };
      
      this.ws!.send(JSON.stringify(message));
      
      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
  
  /**
   * 读取文件
   */
  async readFile(path: string, encoding: string = 'utf-8'): Promise<string> {
    const response = await this.sendRequest({
      id: '',
      tool: 'read_file',
      parameters: { path, encoding }
    });
    return response.data?.content || '';
  }
  
  /**
   * 写入文件
   */
  async writeFile(path: string, content: string, encoding: string = 'utf-8'): Promise<void> {
    await this.sendRequest({
      id: '',
      tool: 'write_file',
      parameters: { path, content, encoding }
    });
  }
  
  /**
   * 编辑文件
   */
  async editFile(path: string, oldString: string, newString: string): Promise<void> {
    await this.sendRequest({
      id: '',
      tool: 'edit_file',
      parameters: { path, old_string: oldString, new_string: newString }
    });
  }
  
  /**
   * 列出文件
   */
  async listFiles(directory: string, pattern?: string): Promise<string[]> {
    const response = await this.sendRequest({
      id: '',
      tool: 'list_files',
      parameters: { directory, pattern }
    });
    
    return response.data?.files || [];
  }
  
  /**
   * 运行命令
   */
  async runCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
    const response = await this.sendRequest({
      id: '',
      tool: 'run_command',
      parameters: { command, cwd }
    });
    
    return response.data || { stdout: '', stderr: '', code: 1 };
  }
  
  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// 单例实例
let clientInstance: FileServiceClient | null = null;

/**
 * 获取文件服务客户端实例
 */
export function getFileServiceClient(): FileServiceClient {
  if (!clientInstance) {
    clientInstance = new FileServiceClient();
  }
  return clientInstance;
}
