'use client';

import { useState } from 'react';

interface ToolCall {
  tool: string;
  params: Record<string, any>;
  result?: any;
  error?: string;
}

interface FileDiff {
  path: string;
  oldContent: string;
  newContent: string;
}

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

function calculateDiff(oldStr: string, newStr: string): Array<{type: 'add' | 'remove' | 'unchanged', content: string, lineNumber?: number}> {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const result: Array<{type: 'add' | 'remove' | 'unchanged', content: string, lineNumber?: number}> = [];
  
  let oldIndex = 0;
  let newIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      result.push({ type: 'add', content: newLines[newIndex], lineNumber: newIndex + 1 });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      result.push({ type: 'remove', content: oldLines[oldIndex], lineNumber: oldIndex + 1 });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      result.push({ type: 'unchanged', content: oldLines[oldIndex], lineNumber: newIndex + 1 });
      oldIndex++;
      newIndex++;
    } else {
      const lookAhead = 3;
      let foundMatch = false;
      
      for (let i = 1; i <= lookAhead; i++) {
        if (oldIndex + i < oldLines.length && oldLines[oldIndex + i] === newLines[newIndex]) {
          for (let j = 0; j < i; j++) {
            result.push({ type: 'remove', content: oldLines[oldIndex + j], lineNumber: oldIndex + j + 1 });
          }
          oldIndex += i;
          foundMatch = true;
          break;
        }
        if (newIndex + i < newLines.length && oldLines[oldIndex] === newLines[newIndex + i]) {
          for (let j = 0; j < i; j++) {
            result.push({ type: 'add', content: newLines[newIndex + j], lineNumber: newIndex + j + 1 });
          }
          newIndex += i;
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        result.push({ type: 'remove', content: oldLines[oldIndex], lineNumber: oldIndex + 1 });
        result.push({ type: 'add', content: newLines[newIndex], lineNumber: newIndex + 1 });
        oldIndex++;
        newIndex++;
      }
    }
  }
  
  return result;
}

function DiffView({ oldContent, newContent, filePath, editCount }: { oldContent: string; newContent: string; filePath: string; editCount?: number }) {
  const [expanded, setExpanded] = useState(true);
  const diff = calculateDiff(oldContent, newContent);
  
  const addedLines = diff.filter(d => d.type === 'add').length;
  const removedLines = diff.filter(d => d.type === 'remove').length;
  const isNewFile = oldContent === '';
  
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden my-2 shadow-sm">
      <div 
        className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 flex items-center justify-between cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {isNewFile ? (
            <span className="text-green-600 font-semibold">✨ 新建文件</span>
          ) : (
            <span className="text-blue-600 font-semibold">📝 编辑文件</span>
          )}
          <span className="font-mono text-sm text-gray-700">{filePath}</span>
          {editCount && editCount > 1 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{editCount} 次编辑</span>
          )}
          {!isNewFile && (
            <>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">+{addedLines}</span>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">-{removedLines}</span>
            </>
          )}
        </div>
        <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && (
        <div className="bg-gray-50 overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <tbody>
              {diff.map((line, index) => (
                <tr
                  key={index}
                  className={
                    line.type === 'add' 
                      ? 'bg-green-50' 
                      : line.type === 'remove' 
                      ? 'bg-red-50' 
                      : ''
                  }
                >
                  <td className="w-12 px-2 py-0.5 text-right text-gray-400 select-none border-r border-gray-200">
                    {line.lineNumber || ''}
                  </td>
                  <td className="w-8 px-2 py-0.5 text-center select-none">
                    {line.type === 'add' ? (
                      <span className="text-green-600">+</span>
                    ) : line.type === 'remove' ? (
                      <span className="text-red-600">-</span>
                    ) : (
                      <span className="text-gray-300"> </span>
                    )}
                  </td>
                  <td className="px-2 py-0.5 whitespace-pre">
                    {line.content || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CommandOutput({ command, output, exitCode }: { command: string; output: string; exitCode?: number }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="border border-gray-300 rounded-md overflow-hidden my-2">
      <div 
        className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">$</span>
          <span className="font-mono text-sm">{command}</span>
          {exitCode !== undefined && (
            <span className={`text-xs px-2 py-0.5 rounded ${exitCode === 0 ? 'bg-green-600' : 'bg-red-600'}`}>
              exit {exitCode}
            </span>
          )}
        </div>
        <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
      </div>
      
      {expanded && output && (
        <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
          {output}
        </pre>
      )}
    </div>
  );
}

function FileOperation({ operation, path, success, stats }: { operation: string; path: string; success: boolean; stats?: string }) {
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden my-2 bg-white shadow-sm">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={success ? 'text-green-600' : 'text-red-600'}>
            {success ? '✓' : '✗'}
          </span>
          <span className="font-semibold text-sm text-gray-700">{operation}</span>
          <span className="font-mono text-sm text-gray-500">{path}</span>
        </div>
        {stats && <span className="text-xs text-gray-400">{stats}</span>}
      </div>
    </div>
  );
}

function ListFilesResult({ files, directory }: { files: string[]; directory: string }) {
  const [expanded, setExpanded] = useState(false);
  const displayFiles = expanded ? files : files.slice(0, 10);
  
  return (
    <div className="border border-gray-300 rounded-md overflow-hidden my-2">
      <div className="bg-blue-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">📁</span>
          <span className="font-semibold text-sm">列出文件</span>
          <span className="font-mono text-sm text-gray-600">{directory}</span>
        </div>
        <span className="text-xs text-blue-600">找到 {files.length} 个</span>
      </div>
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="space-y-1 text-sm font-mono">
          {displayFiles.map((file, i) => {
            const isDir = !file.includes('.');
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gray-400">•</span>
                <span className={isDir ? 'text-blue-600' : 'text-gray-700'}>
                  {file.replace(directory + '/', '')}
                  {isDir && '/'}
                </span>
              </div>
            );
          })}
        </div>
        {files.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? '收起' : `显示全部 ${files.length} 个文件`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (toolCalls.length === 0) return null;
  
  const mergedCalls = toolCalls.reduce((acc, call) => {
    if (call.tool === 'edit_file' || call.tool === 'Edit') {
      const filePath = call.params.file_path || call.params.path;
      const existingEdit = acc.find(c => 
        (c.tool === 'edit_file' || c.tool === 'Edit') && 
        (c.params.file_path || c.params.path) === filePath
      );
      
      if (existingEdit) {
        const currentNew = existingEdit.params.new_string || existingEdit.params.content || '';
        const incomingOld = call.params.old_string || '';
        const incomingNew = call.params.new_string || '';
        
        existingEdit.params.new_string = currentNew.replace(incomingOld, incomingNew);
        existingEdit.editCount = (existingEdit.editCount || 1) + 1;
      } else {
        acc.push({ ...call, editCount: 1 });
      }
    } else {
      acc.push(call);
    }
    return acc;
  }, [] as any[]);
  
  return (
    <div className="space-y-2 my-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">工具调用</div>
      
      {mergedCalls.map((call, index) => {
        if (call.tool === 'execute_command') {
          return (
            <CommandOutput
              key={index}
              command={call.params.command}
              output={call.result?.stdout || ''}
              exitCode={call.result?.exitCode || 0}
            />
          );
        }
        
        if (call.tool === 'read_file' || call.tool === 'Read') {
          const lines = call.result?.content?.split('\n').length || 0;
          const chars = call.result?.content?.length || 0;
          return (
            <FileOperation
              key={index}
              operation="📄 读取文件"
              path={call.params.file_path || call.params.path}
              success={!call.error}
              stats={lines > 0 ? `${lines} 行, ${chars} 字符` : undefined}
            />
          );
        }
        
        if (call.tool === 'write_file' || call.tool === 'Write') {
          return (
            <DiffView
              key={index}
              oldContent=""
              newContent={call.params.content || ''}
              filePath={call.params.file_path || call.params.path}
            />
          );
        }
        
        if (call.tool === 'list_files') {
          const files = call.result?.files || [];
          return (
            <ListFilesResult
              key={index}
              files={files}
              directory={call.params.directory}
            />
          );
        }
        
        if (call.tool === 'edit_file' || call.tool === 'Edit') {
          return (
            <DiffView
              key={index}
              oldContent={call.params.old_string || ''}
              newContent={call.params.new_string || ''}
              filePath={call.params.file_path || call.params.path}
              editCount={call.editCount}
            />
          );
        }
        
        if (call.tool === 'bash' || call.tool === 'Bash') {
          return (
            <CommandOutput
              key={index}
              command={call.params.command}
              output={call.result?.stdout || call.result?.stderr || call.result || ''}
              exitCode={call.result?.exitCode}
            />
          );
        }
        
        return (
          <div key={index} className="border border-gray-300 rounded-md p-3 bg-gray-50 my-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">{call.tool}</div>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(call.params, null, 2)}
            </pre>
            {call.result && (
              <pre className="text-xs text-gray-800 mt-2 overflow-x-auto">
                {typeof call.result === 'string' ? call.result : JSON.stringify(call.result, null, 2)}
              </pre>
            )}
            {call.error && (
              <div className="text-xs text-red-600 mt-2">错误: {call.error}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
