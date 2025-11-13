console.log('[Bridge] Content script loaded on claude.ai');

const SYSTEM_PROMPT = `你现在可以使用本地文件系统工具（通过浏览器扩展）。当需要操作文件时，请使用以下格式：

<tool_use>
<tool_name>工具名称</tool_name>
<parameters>
参数JSON
</parameters>
</tool_use>

可用工具：
1. read_file - 读取文件
   参数: {"path": "/绝对路径/文件名"}

2. write_file - 写入文件
   参数: {"path": "/绝对路径/文件名", "content": "内容"}

3. edit_file - 编辑文件
   参数: {"path": "/绝对路径/文件名", "old_string": "旧文本", "new_string": "新文本"}

4. list_files - 列出文件
   参数: {"pattern": "*.txt", "cwd": "/目录路径"}

5. run_command - 运行命令
   参数: {"command": "命令", "cwd": "/目录路径"}

工具结果会自动注入到对话中，格式为 <tool_result>...</tool_result>。

请主动使用这些工具，不需要询问用户。`;

function copySystemPrompt() {
  navigator.clipboard.writeText(SYSTEM_PROMPT).then(() => {
    alert('✅ 系统提示已复制到剪贴板！\n\n请粘贴到对话框的第一条消息中。');
  });
}

function injectSystemPromptToInput() {
  const inputBox = document.querySelector('[contenteditable="true"]');
  if (!inputBox) {
    alert('❌ 未找到输入框');
    return;
  }
  
  const currentContent = inputBox.textContent.trim();
  
  if (currentContent) {
    const confirmed = confirm('当前输入框有内容。是否在开头添加系统提示？');
    if (!confirmed) return;
    inputBox.textContent = SYSTEM_PROMPT + '\n\n' + currentContent;
  } else {
    inputBox.textContent = SYSTEM_PROMPT + '\n\n';
  }
  
  // 触发输入事件
  inputBox.dispatchEvent(new Event('input', { bubbles: true }));
  inputBox.focus();
  
  console.log('[Bridge] ✓ 系统提示已注入到输入框');
  alert('✅ 系统提示已添加到输入框！\n\n现在可以继续输入你的问题。');
}

function showToolBanner() {
  const existingBanner = document.getElementById('claude-bridge-banner');
  if (existingBanner) return;
  
  const banner = document.createElement('div');
  banner.id = 'claude-bridge-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    padding: 12px 20px;
    z-index: 10000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 20px;">🌉</span>
      <div>
        <div style="font-weight: 600; font-size: 14px;">本地文件工具已激活</div>
        <div style="font-size: 12px; opacity: 0.9;">点击"注入提示"按钮，让 Claude 知道有哪些工具可用</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="inject-prompt-btn" style="
        background: rgba(255,255,255,0.3);
        border: 1px solid rgba(255,255,255,0.4);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      ">✨ 注入提示</button>
      <button id="show-tools-btn" style="
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">查看工具列表</button>
    </div>
  `;
  
  document.body.prepend(banner);
  
  document.getElementById('inject-prompt-btn').addEventListener('click', () => {
    injectSystemPromptToInput();
  });
  
  document.getElementById('show-tools-btn').addEventListener('click', () => {
    showToolsModal();
  });
  
  setTimeout(() => {
    banner.style.transition = 'top 0.3s ease';
    banner.style.top = '-100px';
  }, 8000);
}

function showToolsModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 10001;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    ">
      <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px;">🛠️ 可用的本地文件工具</h2>
      
      <div style="margin-bottom: 16px; padding: 12px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <strong style="color: #1e40af;">如何使用：</strong><br>
        直接告诉 Claude 使用工具，例如：<br>
        <code style="background: white; padding: 2px 6px; border-radius: 3px; font-size: 13px;">
          "使用 read_file 读取 /path/to/file.txt"
        </code>
      </div>
      
      <div style="display: grid; gap: 12px;">
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">📖 read_file</div>
          <div style="font-size: 13px; color: #6b7280;">读取文件内容</div>
          <code style="font-size: 12px; color: #4b5563;">参数: { path: string }</code>
        </div>
        
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">✍️ write_file</div>
          <div style="font-size: 13px; color: #6b7280;">写入文件内容</div>
          <code style="font-size: 12px; color: #4b5563;">参数: { path: string, content: string }</code>
        </div>
        
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">✏️ edit_file</div>
          <div style="font-size: 13px; color: #6b7280;">替换文件中的文本</div>
          <code style="font-size: 12px; color: #4b5563;">参数: { path: string, old_string: string, new_string: string }</code>
        </div>
        
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">📁 list_files</div>
          <div style="font-size: 13px; color: #6b7280;">列出匹配的文件</div>
          <code style="font-size: 12px; color: #4b5563;">参数: { pattern: string, cwd?: string }</code>
        </div>
        
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 4px;">⚡ run_command</div>
          <div style="font-size: 13px; color: #6b7280;">执行 shell 命令</div>
          <code style="font-size: 12px; color: #4b5563;">参数: { command: string, cwd?: string }</code>
        </div>
      </div>
      
      <button id="close-modal" style="
        margin-top: 16px;
        width: 100%;
        background: #3b82f6;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
      ">关闭</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.id === 'close-modal') {
      modal.remove();
    }
  });
}

async function extractAndExecuteTools() {
  const messages = document.querySelectorAll('[data-test-render-count]');
  
  for (const message of messages) {
    const toolUseBlocks = message.querySelectorAll('tool_use, [data-tool-use]');
    
    for (const block of toolUseBlocks) {
      if (block.dataset.executed) continue;
      
      const toolName = block.querySelector('tool_name')?.textContent.trim();
      const paramsText = block.querySelector('parameters')?.textContent.trim();
      
      if (!toolName || !paramsText) continue;
      
      try {
        const parameters = JSON.parse(paramsText);
        
        console.log(`[Bridge] Executing tool: ${toolName}`, parameters);
        
        const response = await chrome.runtime.sendMessage({
          type: 'tool_request',
          tool: toolName,
          parameters
        });
        
        block.dataset.executed = 'true';
        
        const resultDiv = document.createElement('div');
        resultDiv.className = 'tool-result';
        resultDiv.style.cssText = `
          margin-top: 8px;
          padding: 12px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
        `;
        
        if (response.success) {
          resultDiv.innerHTML = `
            <div style="color: #10b981; font-weight: bold; margin-bottom: 4px;">✓ Tool Result:</div>
            <pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(response.data, null, 2)}</pre>
          `;
        } else {
          resultDiv.innerHTML = `
            <div style="color: #ef4444; font-weight: bold; margin-bottom: 4px;">✗ Tool Error:</div>
            <pre style="margin: 0;">${response.error}</pre>
          `;
        }
        
        block.after(resultDiv);
        
        const inputArea = document.querySelector('[contenteditable="true"]');
        if (inputArea && response.success) {
          const resultText = `\n\n<tool_result>\n${JSON.stringify(response.data, null, 2)}\n</tool_result>`;
          inputArea.textContent = resultText;
          inputArea.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
      } catch (error) {
        console.error('[Bridge] Tool execution error:', error);
      }
    }
  }
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      extractAndExecuteTools();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

setTimeout(() => {
  chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
    if (response?.connected) {
      console.log('[Bridge] Connected to local server ✓');
      showToolBanner();
    } else {
      console.log('[Bridge] Not connected to local server ✗');
    }
  });
}, 2000);
