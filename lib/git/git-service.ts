import { execSync } from 'child_process';
import * as path from 'path';

export interface GitStatus {
  branch: string;
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
  staged: string[];
}

export interface CommitResult {
  success: boolean;
  hash?: string;
  message?: string;
  error?: string;
}

export class GitService {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  private exec(command: string): string {
    try {
      return execSync(command, {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
    } catch (error: any) {
      throw new Error(`Git命令执行失败: ${error.message}`);
    }
  }

  isGitRepo(): boolean {
    try {
      this.exec('git rev-parse --is-inside-work-tree');
      return true;
    } catch {
      return false;
    }
  }

  getStatus(): GitStatus {
    const output = this.exec('git status --porcelain');
    const lines = output.split('\n').filter(line => line.trim());

    const status: GitStatus = {
      branch: this.getCurrentBranch(),
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
      staged: []
    };

    for (const line of lines) {
      const statusCode = line.substring(0, 2);
      const filePath = line.substring(3);

      if (statusCode[0] === 'M') status.staged.push(filePath);
      if (statusCode[1] === 'M') status.modified.push(filePath);
      if (statusCode === '??') status.untracked.push(filePath);
      if (statusCode[0] === 'A') status.added.push(filePath);
      if (statusCode[0] === 'D') status.deleted.push(filePath);
    }

    return status;
  }

  getCurrentBranch(): string {
    return this.exec('git rev-parse --abbrev-ref HEAD').trim();
  }

  getDiff(staged: boolean = false): string {
    if (!this.isGitRepo()) {
      console.log('[Git Service] 不是Git仓库，返回空diff');
      return '';
    }
    
    try {
      const command = staged ? 'git diff --staged' : 'git diff';
      return this.exec(command);
    } catch (error) {
      console.log('[Git Service] 获取diff失败，返回空字符串');
      return '';
    }
  }

  add(files: string[]): void {
    if (files.length === 0) return;
    const filesArg = files.map(f => `"${f}"`).join(' ');
    this.exec(`git add ${filesArg}`);
  }

  addAll(): void {
    this.exec('git add -A');
  }

  commit(message: string): CommitResult {
    try {
      this.exec(`git commit -m "${message.replace(/"/g, '\\"')}"`);
      const hash = this.exec('git rev-parse HEAD').trim();
      return {
        success: true,
        hash,
        message: 'Commit成功'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async commitWithDiff(files: string[], message: string): Promise<CommitResult> {
    try {
      if (files.length > 0) {
        this.add(files);
      } else {
        this.addAll();
      }

      return this.commit(message);
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getRecentCommits(count: number = 5): string {
    return this.exec(`git log -${count} --oneline`);
  }

  getFileContent(filePath: string, ref: string = 'HEAD'): string {
    try {
      return this.exec(`git show ${ref}:${filePath}`);
    } catch {
      return '';
    }
  }

  hasUncommittedChanges(): boolean {
    const status = this.getStatus();
    return (
      status.modified.length > 0 ||
      status.added.length > 0 ||
      status.deleted.length > 0 ||
      status.untracked.length > 0
    );
  }
}
