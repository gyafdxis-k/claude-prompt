import * as fs from 'fs';
import * as path from 'path';
import { FILE_SYSTEM } from '../config/constants';

export interface ProjectContext {
  projectPath: string;
  techStack: string[];
  packageManager: string;
  testFramework?: string;
  e2eFramework?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  fileTree: FileNode[];
  importantFiles: string[];
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
}

const IGNORE_PATTERNS = FILE_SYSTEM.IGNORE_PATTERNS;

const IMPORTANT_FILES = [
  ...FILE_SYSTEM.IMPORTANT_FILES,
  'next.config.ts',
  'vite.config.ts',
  'vitest.config.ts',
  'jest.config.js',
  'playwright.config.ts',
  'cypress.config.ts',
  'CLAUDE.md',
  '.cursorrules'
];

export class ProjectScanner {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async scan(): Promise<ProjectContext> {
    const packageJson = this.readPackageJson();
    const techStack = this.detectTechStack(packageJson);
    const testFramework = this.detectTestFramework(packageJson);
    const e2eFramework = this.detectE2EFramework(packageJson);
    const fileTree = this.buildFileTree(this.projectPath);
    const importantFiles = this.findImportantFiles();

    return {
      projectPath: this.projectPath,
      techStack,
      packageManager: this.detectPackageManager(),
      testFramework,
      e2eFramework,
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      scripts: packageJson.scripts || {},
      fileTree,
      importantFiles
    };
  }

  private readPackageJson(): any {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      const content = fs.readFileSync(packagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return { dependencies: {}, devDependencies: {}, scripts: {} };
    }
  }

  private detectTechStack(packageJson: any): string[] {
    const stack: string[] = [];
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (allDeps['react']) stack.push('React');
    if (allDeps['next']) stack.push('Next.js');
    if (allDeps['vue']) stack.push('Vue');
    if (allDeps['typescript']) stack.push('TypeScript');
    if (allDeps['tailwindcss']) stack.push('Tailwind CSS');
    if (allDeps['express']) stack.push('Express');
    if (allDeps['@anthropic-ai/sdk']) stack.push('Claude AI');

    return stack;
  }

  private detectTestFramework(packageJson: any): string | undefined {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (allDeps['vitest']) return 'vitest';
    if (allDeps['jest']) return 'jest';
    if (allDeps['mocha']) return 'mocha';
    return undefined;
  }

  private detectE2EFramework(packageJson: any): string | undefined {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (allDeps['playwright']) return 'playwright';
    if (allDeps['cypress']) return 'cypress';
    if (allDeps['puppeteer']) return 'puppeteer';
    return undefined;
  }

  private detectPackageManager(): string {
    if (fs.existsSync(path.join(this.projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.join(this.projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }

  private shouldIgnore(name: string): boolean {
    return IGNORE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(name);
      }
      return name === pattern;
    });
  }

  private buildFileTree(dirPath: string, depth: number = 0): FileNode[] {
    if (depth > FILE_SYSTEM.MAX_SCAN_DEPTH) return [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        if (this.shouldIgnore(entry.name)) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.projectPath, fullPath);

        if (entry.isDirectory()) {
          nodes.push({
            name: entry.name,
            path: relativePath,
            type: 'directory',
            children: this.buildFileTree(fullPath, depth + 1)
          });
        } else {
          const stats = fs.statSync(fullPath);
          nodes.push({
            name: entry.name,
            path: relativePath,
            type: 'file',
            size: stats.size
          });
        }
      }

      return nodes;
    } catch (error) {
      return [];
    }
  }

  private findImportantFiles(): string[] {
    const files: string[] = [];

    for (const fileName of IMPORTANT_FILES) {
      const filePath = path.join(this.projectPath, fileName);
      if (fs.existsSync(filePath)) {
        files.push(fileName);
      }
    }

    return files;
  }

  readFile(relativePath: string): string {
    try {
      const fullPath = path.join(this.projectPath, relativePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  getFilesContent(relativePaths: string[]): Record<string, string> {
    const contents: Record<string, string> = {};
    for (const filePath of relativePaths) {
      contents[filePath] = this.readFile(filePath);
    }
    return contents;
  }
}
