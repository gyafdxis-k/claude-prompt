import { WebSocketServer, WebSocket } from 'ws';
import { FileService } from './file-service';
import { ToolRequest, WSMessage, ToolResponse } from './protocol';

export class LocalFileServer {
  private wss: WebSocketServer;
  private fileService: FileService;
  private port: number;

  constructor(port: number = 8765, allowedPaths: string[] = []) {
    this.port = port;
    this.fileService = new FileService(allowedPaths);
    this.wss = new WebSocketServer({ port: this.port });
    this.setupServer();
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[Server] Client connected');

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error: any) {
          console.error('[Server] Message error:', error.message);
          this.sendError(ws, error.message);
        }
      });

      ws.on('close', () => {
        console.log('[Server] Client disconnected');
      });

      ws.on('error', (error) => {
        console.error('[Server] WebSocket error:', error.message);
      });

      this.sendMessage(ws, {
        type: 'ping',
        payload: { status: 'connected' }
      });
    });

    console.log(`[Server] Listening on ws://localhost:${this.port}`);
  }

  private async handleMessage(ws: WebSocket, message: WSMessage) {
    if (message.type === 'ping') {
      this.sendMessage(ws, { type: 'pong' });
      return;
    }

    if (message.type === 'tool_request') {
      const request: ToolRequest = message.payload;
      console.log(`[Server] Tool request: ${request.tool}`);

      let response: ToolResponse;

      switch (request.tool) {
        case 'read_file':
          response = await this.fileService.readFile(request.parameters as any);
          break;
        case 'write_file':
          response = await this.fileService.writeFile(request.parameters as any);
          break;
        case 'edit_file':
          response = await this.fileService.editFile(request.parameters as any);
          break;
        case 'list_files':
          response = await this.fileService.listFiles(request.parameters as any);
          break;
        case 'run_command':
          response = await this.fileService.runCommand(request.parameters as any);
          break;
        default:
          response = {
            id: request.id,
            success: false,
            error: `Unknown tool: ${request.tool}`
          };
      }

      response.id = request.id;
      this.sendMessage(ws, {
        type: 'tool_response',
        payload: response
      });
    }
  }

  private sendMessage(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string) {
    this.sendMessage(ws, {
      type: 'error',
      payload: { error }
    });
  }

  setAllowedPaths(paths: string[]) {
    this.fileService.setAllowedPaths(paths);
  }

  close() {
    this.wss.close();
  }
}
