import { NextRequest } from 'next/server';
import { claudeService } from '@/lib/claude-api';
import { WorkflowEngine } from '@/lib/workflows/workflow-engine';

export async function POST(request: NextRequest) {
  console.log('=== API /workflow/execute 开始 ===');
  
  try {
    const body = await request.json();
    console.log('请求体:', JSON.stringify(body, null, 2));
    
    const { step, inputs, projectPath, previousOutputs } = body;

    if (!step || !projectPath) {
      console.error('缺少必要参数: step或projectPath');
      return new Response(
        JSON.stringify({ error: '缺少必要参数: step或projectPath' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authToken = process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_AUTH_TOKEN;
    console.log('API Key状态:', authToken ? '已配置' : '未配置');
    console.log('BASE_URL:', process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL || '默认');

    if (!authToken) {
      return new Response(
        JSON.stringify({ error: '未配置 ANTHROPIC_AUTH_TOKEN' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('初始化 Claude Service...');
    claudeService.initialize(authToken);
    
    console.log('初始化 Workflow Engine...');
    const engine = new WorkflowEngine(claudeService, projectPath);

    console.log('扫描项目上下文...');
    const projectContext = await engine.scanProject();
    console.log('项目技术栈:', projectContext.techStack);

    const currentStepIndex = (previousOutputs || []).findIndex((o: any) => o.stepId === step.id);
    const currentStepOutput = currentStepIndex >= 0 ? previousOutputs[currentStepIndex] : null;
    
    const context = {
      workflow: { id: 'temp', name: 'temp', steps: [], config: {} },
      projectPath,
      inputs: inputs || {},
      outputs: previousOutputs || [],
      projectContext
    };

    console.log('上下文中的所有步骤:', context.outputs.map((o: any) => ({ stepId: o.stepId, stepName: o.stepName, completed: o.completed, conversations: o.conversations.length })));

    console.log('执行步骤:', step.id, step.name);
    console.log('输入参数:', JSON.stringify(inputs, null, 2));
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const MAX_TOKENS = 100000;

          const allPreviousOutputs = context.outputs.filter(o => o.completed);
          
          for (let i = 0; i < allPreviousOutputs.length; i++) {
            const output = allPreviousOutputs[i];
            const estimatedTokens = output.conversations.reduce((sum, conv) => {
              return sum + Math.ceil((conv.response.length + (conv.userInput?.length || 0)) / 4);
            }, 0);

            console.log(`步骤 "${output.stepName}" Token 估计: ${estimatedTokens}`);

            if (estimatedTokens > MAX_TOKENS) {
              console.log(`步骤 "${output.stepName}" 对话超出限制，开始总结...`);
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'summarizing', 
                  data: `正在总结 "${output.stepName}" 的对话历史...` 
                })}\n\n`)
              );

              const conversationText = output.conversations
                .map((conv, index) => {
                  let text = `### 第 ${index + 1} 轮对话\n`;
                  if (conv.userInput && conv.userInput !== '[系统自动总结]') {
                    text += `开发者: ${conv.userInput}\n\n`;
                  }
                  text += `Claude: ${conv.response}\n`;
                  return text;
                })
                .join('\n---\n');

              const summaryPrompt = `请总结以下对话的核心内容，保留所有关键信息、决策和代码实现要点：\n\n${conversationText}\n\n请用简洁的方式总结，确保不丢失重要信息。`;

              let summaryText = '';
              for await (const chunk of claudeService.streamMessage(summaryPrompt)) {
                summaryText += chunk;
              }

              console.log(`步骤 "${output.stepName}" 总结完成，长度: ${summaryText.length}`);
              
              const outputIndex = context.outputs.findIndex(o => o.stepId === output.stepId);
              if (outputIndex >= 0) {
                context.outputs[outputIndex].conversations = [
                  {
                    prompt: '对话总结',
                    response: `# ${output.stepName} - 历史对话总结\n\n${summaryText}`,
                    timestamp: Date.now(),
                    userInput: '[系统自动总结]'
                  }
                ];
              }
            }
          }

          if (currentStepOutput && currentStepOutput.conversations.length > 0) {
            const estimatedTokens = currentStepOutput.conversations.reduce((sum, conv) => {
              return sum + Math.ceil((conv.response.length + (conv.userInput?.length || 0)) / 4);
            }, 0);

            console.log(`当前步骤对话 Token 估计: ${estimatedTokens}`);

            if (estimatedTokens > MAX_TOKENS) {
              console.log('当前步骤对话超出限制，开始总结...');
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'summarizing', 
                  data: '当前步骤对话历史过长，正在总结...' 
                })}\n\n`)
              );

              const conversationText = currentStepOutput.conversations
                .map((conv, index) => {
                  let text = `### 第 ${index + 1} 轮对话\n`;
                  if (conv.userInput && conv.userInput !== '[系统自动总结]') {
                    text += `开发者: ${conv.userInput}\n\n`;
                  }
                  text += `Claude: ${conv.response}\n`;
                  return text;
                })
                .join('\n---\n');

              const summaryPrompt = `请总结以下对话的核心内容，保留所有关键信息、决策和代码实现要点：\n\n${conversationText}\n\n请用简洁的方式总结，确保不丢失重要信息。`;

              let summaryText = '';
              for await (const chunk of claudeService.streamMessage(summaryPrompt)) {
                summaryText += chunk;
              }

              console.log('当前步骤总结完成，长度:', summaryText.length);
              
              context.outputs[context.outputs.length - 1].conversations = [
                {
                  prompt: '对话总结',
                  response: `# 历史对话总结\n\n${summaryText}`,
                  timestamp: Date.now(),
                  userInput: '[系统自动总结]'
                }
              ];
            }
          }

          const prompt = engine.renderPromptPublic(step.prompt, context);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'prompt', 
              data: prompt 
            })}\n\n`)
          );

          let fullResponse = '';
          
          for await (const chunk of claudeService.streamMessage(prompt)) {
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
            userInput: userInput
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              data: conversationTurn 
            })}\n\n`)
          );

          console.log('步骤执行完成，响应长度:', fullResponse.length);
          console.log('=== API /workflow/execute 完成 ===');
          
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
