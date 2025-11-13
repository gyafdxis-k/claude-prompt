import { NextRequest } from 'next/server';
import { claudeService } from '@/lib/claude-api';
import { WorkflowEngine } from '@/lib/workflows/workflow-engine';
import { FILE_OPERATION_TOOLS, createSystemPromptWithFileOps } from '@/lib/file-bridge/claude-tools';
import { ServerFileOperations } from '@/lib/file-bridge/server-file-ops';

const projectContextCache = new Map<string, { context: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { step, inputs, projectPath, previousOutputs } = body;

    if (!step || !projectPath) {
      console.error('缺少必要参数: step或projectPath');
      return new Response(
        JSON.stringify({ error: '缺少必要参数: step或projectPath' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authToken = process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_AUTH_TOKEN;

    if (!authToken) {
      return new Response(
        JSON.stringify({ error: '未配置 ANTHROPIC_AUTH_TOKEN' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    claudeService.initialize(authToken);
    const engine = new WorkflowEngine(claudeService, projectPath);

    let projectContext;
    const cached = projectContextCache.get(projectPath);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      projectContext = cached.context;
    } else {
      projectContext = await engine.scanProject();
      projectContextCache.set(projectPath, { context: projectContext, timestamp: now });
    }

    const currentStepIndex = (previousOutputs || []).findIndex((o: any) => o.stepId === step.id);
    const currentStepOutput = currentStepIndex >= 0 ? previousOutputs[currentStepIndex] : null;
    
    const context = {
      workflow: { id: 'temp', name: 'temp', description: '', icon: '⚡', steps: [], config: {} },
      projectPath,
      inputs: inputs || {},
      outputs: previousOutputs || [],
      projectContext
    };
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const taskDescription = `${step.name}: ${inputs.continuationInput || inputs.requirement || inputs.bug_description || inputs.target_code || inputs.refactor_goal || '执行任务'}`;
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'task_info', 
              data: {
                stepName: step.name,
                description: taskDescription.substring(0, 200),
                projectPath: projectPath.split('/').pop()
              }
            })}\n\n`)
          );

          const MAX_TOKENS = 50000;

          if (currentStepOutput && currentStepOutput.conversations.length > 5) {
            const estimatedTokens = currentStepOutput.conversations.reduce((sum: number, conv: any) => {
              return sum + Math.ceil((conv.response.length + (conv.userInput?.length || 0)) / 4);
            }, 0);

            if (estimatedTokens > MAX_TOKENS && !currentStepOutput.conversations.some((c: any) => c.userInput === '[系统自动总结]')) {
              const conversationText = currentStepOutput.conversations
                .map((conv: any) => `${conv.userInput || ''}\n${conv.response}`)
                .join('\n\n');

              const summaryPrompt = `简要总结以下对话的关键决策和代码修改（500字内）:\n\n${conversationText.substring(0, 10000)}`;

              let summaryText = '';
              for await (const chunk of claudeService.streamMessage(summaryPrompt, { maxTokens: 2000 })) {
                summaryText += chunk;
              }
              
              context.outputs[context.outputs.length - 1].conversations = [
                {
                  prompt: '对话总结',
                  response: `# 总结\n\n${summaryText}`,
                  timestamp: Date.now(),
                  userInput: '[系统自动总结]'
                }
              ];
            }
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'preparing', 
              data: '准备执行...' 
            })}\n\n`)
          );

          let prompt = engine.renderPromptPublic(step.prompt, context);
          prompt = createSystemPromptWithFileOps(prompt, projectPath, projectContext);

          const fileOps = new ServerFileOperations([projectPath]);
          const toolCalls: any[] = [];

          const handleToolUse = async (toolName: string, toolInput: any) => {
            console.log(`[Tool] 执行工具: ${toolName}`, toolInput);
            
            switch (toolName) {
              case 'execute_command':
                const cmdResult = await fileOps.executeCommand(
                  toolInput.command, 
                  toolInput.cwd || projectPath
                );
                return cmdResult;
              
              case 'read_file':
                const content = await fileOps.readFile(toolInput.path);
                return { content };
              
              case 'write_file':
                await fileOps.writeFile(toolInput.path, toolInput.content);
                return { success: true, message: `文件已写入: ${toolInput.path}` };
              
              case 'edit_file':
                await fileOps.editFile(toolInput.path, toolInput.old_string, toolInput.new_string);
                return { success: true, message: `文件已编辑: ${toolInput.path}` };
              
              case 'list_files':
                const files = await fileOps.listFiles(toolInput.directory, toolInput.pattern);
                return { files };
              
              default:
                throw new Error(`未知工具: ${toolName}`);
            }
          };

          const handleToolCall = (toolCall: any) => {
            toolCalls.push(toolCall);
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'tool_call', 
                data: toolCall 
              })}\n\n`)
            );
          };

          let fullResponse = '';
          
          for await (const chunk of claudeService.streamMessage(prompt, {
            tools: FILE_OPERATION_TOOLS,
            onToolUse: handleToolUse,
            onToolCall: handleToolCall
          })) {
            fullResponse += chunk;
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'chunk', 
                data: chunk 
              })}\n\n`)
            );
          }

          const userInput = inputs.continuationInput || inputs.requirement || inputs.bug_description || inputs.target_code || inputs.refactor_goal || '';
          
          const conversationTurn = {
            prompt,
            response: fullResponse,
            timestamp: Date.now(),
            userInput: userInput,
            toolCalls
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              data: conversationTurn 
            })}\n\n`)
          );

          controller.close();
        } catch (error: any) {
          console.error('=== 流式处理错误 ===');
          console.error('错误消息:', error.message);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              data: error.message 
            })}\n\n`)
          );
          
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error: any) {
    console.error('=== API /workflow/execute 错误 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    return new Response(
      JSON.stringify({ error: error.message || '执行失败', stack: error.stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
