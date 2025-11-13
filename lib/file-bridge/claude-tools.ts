export const FILE_OPERATION_TOOLS = [
  {
    name: 'execute_command',
    description: '在系统shell中执行命令。用于运行构建、测试、git操作等任何shell命令。命令会在指定的工作目录中执行。',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: '要执行的shell命令，例如: npm test, git status, ls -la'
        },
        cwd: {
          type: 'string',
          description: '命令执行的工作目录（可选，默认为项目根目录）'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'read_file',
    description: '读取本地文件内容。用于查看现有代码、配置文件或文档。',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '要读取的文件的绝对路径，例如: /Users/gaodong/Desktop/claude-prompt/README.md'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: '写入内容到本地文件。用于创建新文件或完全覆盖现有文件的内容。当你需要创建新代码文件或更新整个文件时使用此工具。',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '要写入的文件的绝对路径'
        },
        content: {
          type: 'string',
          description: '要写入文件的完整内容'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: '编辑文件的部分内容。通过查找旧内容并替换为新内容来修改文件。适用于对现有文件进行局部修改。',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '要编辑的文件的绝对路径'
        },
        old_string: {
          type: 'string',
          description: '要替换的旧内容（必须精确匹配文件中的内容）'
        },
        new_string: {
          type: 'string',
          description: '新的内容'
        }
      },
      required: ['path', 'old_string', 'new_string']
    }
  },
  {
    name: 'list_files',
    description: '列出指定目录下的文件。可以使用通配符模式过滤文件类型。',
    input_schema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: '要列出文件的目录路径'
        },
        pattern: {
          type: 'string',
          description: '文件匹配模式，例如: *.ts, *.tsx, *.md 等（可选）'
        }
      },
      required: ['directory']
    }
  }
];

export function createSystemPromptWithFileOps(basePrompt: string, projectPath: string, projectContext?: any): string {
  let contextSection = '';
  
  if (projectContext) {
    contextSection = `
## 📊 项目上下文（已自动扫描）

> ⚠️ **重要性能规则**:
> 1. ❌ **禁止使用 list_files 探索项目结构** - 所有目录信息已在下方提供
> 2. ❌ **禁止使用 execute_command 运行 find/ls 等探索命令** - 会严重影响性能
> 3. ✅ **直接使用下方提供的文件路径** - 直接用 read_file 读取需要的文件
> 4. ✅ **如需了解文件内容才能决定，先读取最相关的1-2个文件**

**项目基本信息**:
- 📁 路径: ${projectPath}
- 🔧 技术栈: ${projectContext.techStack?.join(', ') || '未知'}
- 📦 包管理器: ${projectContext.packageManager || '未知'}
- 🧪 测试框架: ${projectContext.testFramework || '未知'}
${projectContext.e2eFramework ? `- 🎭 E2E框架: ${projectContext.e2eFramework}` : ''}

${projectContext.mainFiles?.length > 0 ? `**项目主要文件（可直接使用）**:
${projectContext.mainFiles.map((f: string) => `- ${f}`).join('\n')}
` : ''}

⚡ **高效工作方式**:
1. 根据任务需求，直接从上述文件列表中选择相关文件
2. 使用 read_file 读取这些文件（而不是先 list_files）
3. 基于文件内容进行分析和修改

---
`;
  }

  return `${basePrompt}

${contextSection}
## 🔧 文件操作能力与行为规范

你现在可以直接操作本地文件系统。项目根目录: ${projectPath}

### ⚠️ 核心行为规则（必须遵守）

> **规则1：直接使用工具修改文件**
> 当你需要创建或修改代码时，**必须直接使用 write_file 或 edit_file 工具**。
> - ❌ 错误：在回复中展示代码块让用户自己复制
> - ❌ 错误：创建辅助脚本（如 add_method.py）来修改文件
> - ❌ 错误：使用 sed/awk 等命令修改文件
> - ✅ 正确：直接调用 write_file 或 edit_file 工具写入文件

> **规则2：完整的开发流程**
> 1. 使用 read_file 读取需要修改的文件
> 2. **直接使用 write_file/edit_file 工具修改文件**（不要创建临时脚本）
> 3. 在回复中简要说明做了什么修改（可选：展示关键代码片段）
> 4. 如需验证，使用 execute_command 运行测试或构建

> **规则3：禁止创建辅助脚本**
> - ❌ 不要创建任何 .py、.js、.sh 等辅助脚本来修改文件
> - ❌ 不要使用 execute_command 运行 sed、awk、perl 等文本处理命令
> - ✅ 始终使用 write_file 和 edit_file 工具直接操作目标文件

**重要提醒**:
- 你可以访问用户电脑上的任何文件，不仅限于项目目录
- 支持绝对路径: /Users/gaodong/Desktop/文件.txt
- 支持波浪号: ~/Desktop/文件.txt (会自动展开)
- 支持中文路径和文件名

### 工作流程示例：

1. **执行Shell命令**:
   - 使用 execute_command 运行任何shell命令
   - 例如: execute_command({ command: "npm test", cwd: "${projectPath}" })
   - 或: execute_command({ command: "git status" })
   - 可以运行构建、测试、git操作等任何命令

2. **读取任意文件**:
   - 使用 read_file 读取用户提供的任何文件路径
   - 例如: read_file({ path: "~/Desktop/JTBD RBAC权限文档.txt" })
   - 或: read_file({ path: "/Users/gaodong/Desktop/需求文档.md" })

3. **创建新文件**:
   - 使用 write_file 工具直接创建文件
   - 例如: write_file({ path: "${projectPath}/components/NewComponent.tsx", content: "..." })

4. **修改现有文件**:
   - 先用 read_file 读取文件内容
   - 然后用 edit_file 或 write_file 更新文件

5. **查看项目结构**:
   - 使用 list_files 列出目录中的文件
   - 例如: list_files({ directory: "${projectPath}/components", pattern: "*.tsx" })

### 重要提示：
- 不要说"我无法访问文件" - 你有完整的文件系统访问权限
- 当用户提供文件路径时，直接使用 read_file 工具读取
- 所有代码修改都应该通过工具直接写入文件
- 不要只在回复中显示代码，用户希望代码直接保存到文件中
- 修改文件后，可以简要说明你做了什么改动
`;
}
