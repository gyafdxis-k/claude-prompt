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

    const context = {
      workflow: { id: 'temp', name: 'temp', steps: [], config: {} },
      projectPath,
      inputs: inputs || {},
      outputs: previousOutputs || [],
      projectContext
    };

    console.log('执行步骤:', step.id, step.name);
    console.log('输入参数:', JSON.stringify(inputs, null, 2));
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
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

          const output = {
            stepId: step.id,
            stepName: step.name,
            prompt,
            response: fullResponse,
            timestamp: Date.now()
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              data: output 
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
