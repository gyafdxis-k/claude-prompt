import { NextRequest, NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflows/workflow-engine';
import { claudeService } from '@/lib/claude-api';

export async function POST(request: NextRequest) {
  try {
    const { step, context } = await request.json();

    const authToken = process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_AUTH_TOKEN;
    if (!authToken) {
      return NextResponse.json({ error: '未配置 ANTHROPIC_AUTH_TOKEN' }, { status: 400 });
    }

    claudeService.initialize(authToken);
    const engine = new WorkflowEngine(claudeService, context.projectPath);

    const renderedPrompt = engine.renderPromptPublic(step.prompt, context);

    return NextResponse.json({ prompt: renderedPrompt });
  } catch (error: any) {
    console.error('渲染 Prompt 失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
