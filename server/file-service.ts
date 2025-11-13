import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { glob } from 'glob';
import {
  ReadFileParams,
  WriteFileParams,
  EditFileParams,
  ListFilesParams,
  RunCommandParams,
  ToolResponse
} from './protocol';

const execAsync = promisify(exec);

export class FileService {
  private allowedPaths: string[] = [];

  constructor(allowedPaths: string[] = []) {
    this.allowedPaths = allowedPaths;
  }

  setAllowedPaths(paths: string[]) {
    this.allowedPaths = paths;
  }

  private isPathAllowed(filePath: string): boolean {
    if (this.allowedPaths.length === 0) return true;
    
    const absolutePath = path.resolve(filePath);
    return this.allowedPaths.some(allowedPath => {
      const resolvedAllowed = path.resolve(allowedPath);
      return absolutePath.startsWith(resolvedAllowed);
    });
  }

  async readFile(params: ReadFileParams): Promise<ToolResponse> {
    try {
      if (!this.isPathAllowed(params.path)) {
        return {
          id: '',
          success: false,
          error: `Path not allowed: ${params.path}`
        };
      }

      const content = await fs.promises.readFile(
        params.path,
        { encoding: (params.encoding as BufferEncoding) || 'utf-8' }
      );

      return {
        id: '',
        success: true,
        data: {
          path: params.path,
          content,
          size: content.length
        }
      };
    } catch (error: any) {
      return {
        id: '',
        success: false,
        error: error.message
      };
    }
  }

  async writeFile(params: WriteFileParams): Promise<ToolResponse> {
    try {
      if (!this.isPathAllowed(params.path)) {
        return {
          id: '',
          success: false,
          error: `Path not allowed: ${params.path}`
        };
      }

      const dir = path.dirname(params.path);
      await fs.promises.mkdir(dir, { recursive: true });

      await fs.promises.writeFile(
        params.path,
        params.content,
        { encoding: (params.encoding as BufferEncoding) || 'utf-8' }
      );

      return {
        id: '',
        success: true,
        data: {
          path: params.path,
          size: params.content.length
        }
      };
    } catch (error: any) {
      return {
        id: '',
        success: false,
        error: error.message
      };
    }
  }

  async editFile(params: EditFileParams): Promise<ToolResponse> {
    try {
      if (!this.isPathAllowed(params.path)) {
        return {
          id: '',
          success: false,
          error: `Path not allowed: ${params.path}`
        };
      }

      const content = await fs.promises.readFile(params.path, 'utf-8');
      
      if (!content.includes(params.old_string)) {
        return {
          id: '',
          success: false,
          error: `Old string not found in file: ${params.path}`
        };
      }

      const newContent = content.replace(params.old_string, params.new_string);
      await fs.promises.writeFile(params.path, newContent, 'utf-8');

      return {
        id: '',
        success: true,
        data: {
          path: params.path,
          replacements: 1
        }
      };
    } catch (error: any) {
      return {
        id: '',
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(params: ListFilesParams): Promise<ToolResponse> {
    try {
      const cwd = params.cwd || process.cwd();
      
      if (!this.isPathAllowed(cwd)) {
        return {
          id: '',
          success: false,
          error: `Path not allowed: ${cwd}`
        };
      }

      const files = await glob(params.pattern, { cwd });

      return {
        id: '',
        success: true,
        data: {
          files,
          count: files.length
        }
      };
    } catch (error: any) {
      return {
        id: '',
        success: false,
        error: error.message
      };
    }
  }

  async runCommand(params: RunCommandParams): Promise<ToolResponse> {
    try {
      const cwd = params.cwd || process.cwd();
      
      if (!this.isPathAllowed(cwd)) {
        return {
          id: '',
          success: false,
          error: `Path not allowed: ${cwd}`
        };
      }

      const { stdout, stderr } = await execAsync(params.command, {
        cwd,
        timeout: params.timeout || 30000
      });

      return {
        id: '',
        success: true,
        data: {
          stdout,
          stderr,
          command: params.command
        }
      };
    } catch (error: any) {
      return {
        id: '',
        success: false,
        error: error.message,
        data: {
          stdout: error.stdout || '',
          stderr: error.stderr || '',
          command: params.command
        }
      };
    }
  }
}
