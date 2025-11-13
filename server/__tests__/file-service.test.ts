import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileService } from '../file-service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FileService', () => {
  let fileService: FileService;
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), 'file-service-test-' + Date.now());
    await fs.promises.mkdir(testDir, { recursive: true });
    fileService = new FileService([testDir]);
  });

  afterEach(async () => {
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      const testFile = path.join(testDir, 'test.txt');
      const content = 'Hello World';
      await fs.promises.writeFile(testFile, content);

      const result = await fileService.readFile({ path: testFile });

      expect(result.success).toBe(true);
      expect(result.data.content).toBe(content);
      expect(result.data.path).toBe(testFile);
    });

    it('should fail for non-existent file', async () => {
      const testFile = path.join(testDir, 'non-existent.txt');

      const result = await fileService.readFile({ path: testFile });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should fail for disallowed path', async () => {
      const result = await fileService.readFile({ path: '/tmp/forbidden.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      const testFile = path.join(testDir, 'new.txt');
      const content = 'Test content';

      const result = await fileService.writeFile({ path: testFile, content });

      expect(result.success).toBe(true);
      const written = await fs.promises.readFile(testFile, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create parent directories', async () => {
      const testFile = path.join(testDir, 'sub', 'dir', 'file.txt');
      const content = 'Nested file';

      const result = await fileService.writeFile({ path: testFile, content });

      expect(result.success).toBe(true);
      expect(fs.existsSync(testFile)).toBe(true);
    });

    it('should fail for disallowed path', async () => {
      const result = await fileService.writeFile({
        path: '/tmp/forbidden.txt',
        content: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('editFile', () => {
    it('should edit file successfully', async () => {
      const testFile = path.join(testDir, 'edit.txt');
      const original = 'Hello World';
      await fs.promises.writeFile(testFile, original);

      const result = await fileService.editFile({
        path: testFile,
        old_string: 'World',
        new_string: 'Claude'
      });

      expect(result.success).toBe(true);
      const edited = await fs.promises.readFile(testFile, 'utf-8');
      expect(edited).toBe('Hello Claude');
    });

    it('should fail if old string not found', async () => {
      const testFile = path.join(testDir, 'edit.txt');
      await fs.promises.writeFile(testFile, 'Hello World');

      const result = await fileService.editFile({
        path: testFile,
        old_string: 'NotFound',
        new_string: 'Replacement'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('listFiles', () => {
    it('should list files with pattern', async () => {
      await fs.promises.writeFile(path.join(testDir, 'file1.txt'), '');
      await fs.promises.writeFile(path.join(testDir, 'file2.txt'), '');
      await fs.promises.writeFile(path.join(testDir, 'file.js'), '');

      const result = await fileService.listFiles({
        pattern: '*.txt',
        cwd: testDir
      });

      expect(result.success).toBe(true);
      expect(result.data.files).toHaveLength(2);
      expect(result.data.files).toContain('file1.txt');
      expect(result.data.files).toContain('file2.txt');
    });
  });

  describe('runCommand', () => {
    it('should run command successfully', async () => {
      const result = await fileService.runCommand({
        command: 'echo "test"',
        cwd: testDir
      });

      expect(result.success).toBe(true);
      expect(result.data.stdout.trim()).toBe('test');
    });

    it('should handle command failure', async () => {
      const result = await fileService.runCommand({
        command: 'exit 1',
        cwd: testDir
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
