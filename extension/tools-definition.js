// Anthropic 官方 Tool Use API 工具定义
const TOOLS = [
  {
    name: "read_file",
    description: "Read the contents of a file from the local filesystem. Returns the file content as a string.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The absolute path to the file to read"
        }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Write content to a file on the local filesystem. Creates the file if it doesn't exist, or overwrites it if it does.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The absolute path where the file should be written"
        },
        content: {
          type: "string",
          description: "The content to write to the file"
        }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "edit_file",
    description: "Replace a specific string in a file with a new string. Useful for making targeted edits.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The absolute path to the file to edit"
        },
        old_string: {
          type: "string",
          description: "The exact string to find and replace"
        },
        new_string: {
          type: "string",
          description: "The string to replace it with"
        }
      },
      required: ["path", "old_string", "new_string"]
    }
  },
  {
    name: "list_files",
    description: "List files in a directory matching a glob pattern. Returns an array of file paths.",
    input_schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Glob pattern to match files (e.g., '*.js', '**/*.txt')"
        },
        cwd: {
          type: "string",
          description: "The directory to search in (defaults to current working directory)"
        }
      },
      required: ["pattern"]
    }
  },
  {
    name: "run_command",
    description: "Execute a shell command on the local system. Returns stdout and stderr.",
    input_schema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute"
        },
        cwd: {
          type: "string",
          description: "The working directory to run the command in"
        },
        timeout: {
          type: "number",
          description: "Maximum time in milliseconds to wait for command completion (default: 30000)"
        }
      },
      required: ["command"]
    }
  }
];

// 注入到页面的函数
function injectToolsIntoClaudeAPI() {
  console.log('[Bridge] 尝试拦截 Claude API 调用...');
  
  // 拦截 fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    // 检查是否是 Claude API 调用
    if (url && url.toString().includes('api.anthropic.com/v1/messages')) {
      console.log('[Bridge] 检测到 Claude API 调用');
      
      try {
        if (options && options.body) {
          const body = JSON.parse(options.body);
          
          // 自动添加工具定义
          if (!body.tools) {
            console.log('[Bridge] 自动注入工具定义到 API 请求');
            body.tools = TOOLS;
            options.body = JSON.stringify(body);
          }
        }
      } catch (e) {
        console.error('[Bridge] 无法修改 API 请求:', e);
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('[Bridge] API 拦截已设置');
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TOOLS, injectToolsIntoClaudeAPI };
}
