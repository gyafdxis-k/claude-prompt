export interface ExecutionHistory {
  id: string;
  workflowId: string;
  workflowName: string;
  projectPath: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  outputs: Array<{
    stepId: string;
    stepName: string;
    conversations: Array<{
      userInput: string;
      response: string;
      prompt: string;
      timestamp: number;
    }>;
    completed: boolean;
  }>;
}

const HISTORY_KEY = 'claude-prompt-execution-history';
const MAX_HISTORY_ITEMS = 50;

export function getExecutionHistory(): ExecutionHistory[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveExecutionHistory(history: Omit<ExecutionHistory, 'id'>): ExecutionHistory {
  const allHistory = getExecutionHistory();
  const newHistory: ExecutionHistory = {
    ...history,
    id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  allHistory.unshift(newHistory);
  
  const trimmed = allHistory.slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  
  return newHistory;
}

export function updateExecutionHistory(id: string, updates: Partial<ExecutionHistory>): void {
  const allHistory = getExecutionHistory();
  const index = allHistory.findIndex(h => h.id === id);
  
  if (index >= 0) {
    allHistory[index] = { ...allHistory[index], ...updates };
    localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistory));
  }
}

export function deleteExecutionHistory(id: string): void {
  const allHistory = getExecutionHistory();
  const filtered = allHistory.filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export function clearExecutionHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function searchExecutionHistory(query: string): ExecutionHistory[] {
  const allHistory = getExecutionHistory();
  const lowerQuery = query.toLowerCase();
  
  return allHistory.filter(h =>
    h.workflowName.toLowerCase().includes(lowerQuery) ||
    h.projectPath.toLowerCase().includes(lowerQuery) ||
    h.outputs.some(o =>
      o.stepName.toLowerCase().includes(lowerQuery) ||
      o.conversations.some(c =>
        c.userInput.toLowerCase().includes(lowerQuery) ||
        c.response.toLowerCase().includes(lowerQuery)
      )
    )
  );
}

export function getHistoryByWorkflow(workflowId: string): ExecutionHistory[] {
  const allHistory = getExecutionHistory();
  return allHistory.filter(h => h.workflowId === workflowId);
}

export function getHistoryByProject(projectPath: string): ExecutionHistory[] {
  const allHistory = getExecutionHistory();
  return allHistory.filter(h => h.projectPath === projectPath);
}

export function exportHistoryToMarkdown(history: ExecutionHistory): string {
  const lines: string[] = [];
  
  lines.push(`# ${history.workflowName}`);
  lines.push('');
  lines.push(`**项目**: ${history.projectPath}`);
  lines.push(`**开始时间**: ${new Date(history.startTime).toLocaleString('zh-CN')}`);
  if (history.endTime) {
    lines.push(`**结束时间**: ${new Date(history.endTime).toLocaleString('zh-CN')}`);
    const duration = Math.round((history.endTime - history.startTime) / 1000);
    lines.push(`**耗时**: ${duration}秒`);
  }
  lines.push(`**状态**: ${history.status === 'completed' ? '✅ 已完成' : history.status === 'failed' ? '❌ 失败' : '⏳ 运行中'}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  
  history.outputs.forEach((output, stepIndex) => {
    lines.push(`## 步骤 ${stepIndex + 1}: ${output.stepName}`);
    lines.push('');
    
    if (output.conversations.length === 0) {
      lines.push('*未执行*');
      lines.push('');
    } else {
      output.conversations.forEach((conv, convIndex) => {
        lines.push(`### 对话轮次 ${convIndex + 1}`);
        lines.push('');
        lines.push(`**时间**: ${new Date(conv.timestamp).toLocaleString('zh-CN')}`);
        lines.push('');
        
        if (conv.userInput && conv.userInput.trim()) {
          lines.push('**用户输入**:');
          lines.push('```');
          lines.push(conv.userInput);
          lines.push('```');
          lines.push('');
        }
        
        lines.push('**AI 回复**:');
        lines.push('');
        lines.push(conv.response);
        lines.push('');
        lines.push('---');
        lines.push('');
      });
    }
  });
  
  return lines.join('\n');
}
