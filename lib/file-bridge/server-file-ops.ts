import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ServerFileOperations {
  private allowedPaths: string[];

  constructor(allowedPaths: string[]) {
    this.allowedPaths = allowedPaths;
  }

  private expandTilde(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    return filePath;
  }

  private isPathAllowed(filePath: string): boolean {
    if (this.allowedPaths.length === 0) {
      return true;
    }
    
    const expandedPath = this.expandTilde(filePath);
    const absolutePath = path.resolve(expandedPath);
    return this.allowedPaths.some(allowedPath => 
      absolutePath.startsWith(path.resolve(allowedPath))
    );
  }

  async readFile(filePath: string): Promise<string> {
    const expandedPath = this.expandTilde(filePath);
    
    if (!this.isPathAllowed(expandedPath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    const content = await fs.readFile(expandedPath, 'utf-8');
    console.log(`[FileOps] Read file: ${expandedPath} (${content.length} bytes)`);
    return content;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const expandedPath = this.expandTilde(filePath);
    
    if (!this.isPathAllowed(expandedPath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    const dir = path.dirname(expandedPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(expandedPath, content, 'utf-8');
    console.log(`[FileOps] Wrote file: ${expandedPath} (${content.length} bytes)`);
  }

  async editFile(filePath: string, oldString: string, newString: string): Promise<void> {
    const expandedPath = this.expandTilde(filePath);
    
    if (!this.isPathAllowed(expandedPath)) {
      throw new Error(`Access denied: ${filePath}`);
    }

    const content = await this.readFile(expandedPath);
    if (!content.includes(oldString)) {
      throw new Error(`String not found in file: ${expandedPath}`);
    }

    const newContent = content.replace(oldString, newString);
    await this.writeFile(expandedPath, newContent);
    console.log(`[FileOps] Edited file: ${expandedPath}`);
  }

  async listFiles(directory: string, pattern?: string): Promise<string[]> {
    const expandedDir = this.expandTilde(directory);
    
    if (!this.isPathAllowed(expandedDir)) {
      throw new Error(`Access denied: ${directory}`);
    }

    const searchPattern = pattern 
      ? path.join(expandedDir, pattern)
      : path.join(expandedDir, '*');

    const files = await glob(searchPattern);
    console.log(`[FileOps] Listed ${files.length} files in: ${expandedDir}`);
    return files;
  }

  async executeCommand(command: string, cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const workingDir = cwd ? this.expandTilde(cwd) : process.cwd();
    
    console.log(`[FileOps] Executing command: ${command} (cwd: ${workingDir})`);
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        maxBuffer: 10 * 1024 * 1024,
        env: process.env
      });
      
      console.log(`[FileOps] Command completed successfully`);
      if (stdout) console.log(`[FileOps] stdout: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`);
      if (stderr) console.log(`[FileOps] stderr: ${stderr.substring(0, 200)}${stderr.length > 200 ? '...' : ''}`);
      
      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      console.error(`[FileOps] Command failed:`, error.message);
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1
      };
    }
  }
}
