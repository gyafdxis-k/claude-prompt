import { Workflow, WorkflowStep } from './workflow-templates';
import { ClaudeService } from '../claude-api';
import { ProjectScanner, ProjectContext } from '../context/project-scanner';
import { GitService } from '../git/git-service';

export interface ConversationTurn {
  prompt: string;
  response: string;
  timestamp: number;
  userInput?: string;
}

export interface StepOutput {
  stepId: string;
  stepName: string;
  conversations: ConversationTurn[];
  approved?: boolean;
  completed?: boolean;
}

export interface WorkflowExecutionContext {
  workflow: Workflow;
  projectPath: string;
  inputs: Record<string, any>;
  outputs: StepOutput[];
  projectContext?: ProjectContext;
}

export class WorkflowEngine {
  private claude: ClaudeService;
  private scanner: ProjectScanner;
  private git: GitService;

  constructor(
    claude: ClaudeService,
    projectPath: string
  ) {
    this.claude = claude;
    this.scanner = new ProjectScanner(projectPath);
    this.git = new GitService(projectPath);
  }

  async executeStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext
  ): Promise<StepOutput> {
    const prompt = this.renderPrompt(step.prompt, context);

    let response = '';
    for await (const chunk of this.claude.streamMessage(prompt)) {
      response += chunk;
      if (context.outputs.length > 0) {
        context.outputs[context.outputs.length - 1].response = response;
      }
    }

    const output: StepOutput = {
      stepId: step.id,
      stepName: step.name,
      prompt,
      response,
      timestamp: Date.now()
    };

    return output;
  }

  renderPromptPublic(
    template: string,
    context: WorkflowExecutionContext
  ): string {
    return this.renderPrompt(template, context);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async summarizeConversations(conversations: ConversationTurn[]): Promise<string> {
    const conversationText = conversations
      .map((conv, index) => {
        let text = `### 第 ${index + 1} 轮对话\n`;
        if (conv.userInput) text += `开发者: ${conv.userInput}\n`;
        text += `Claude: ${conv.response}\n`;
        return text;
      })
      .join('\n---\n');

    const summaryPrompt = `请总结以下对话的核心内容，保留所有关键信息、决策和代码实现要点：\n\n${conversationText}\n\n请用简洁的方式总结，确保不丢失重要信息。`;

    let summary = '';
    for await (const chunk of this.claude.streamMessage(summaryPrompt)) {
      summary += chunk;
    }

    return summary;
  }

  private renderPrompt(
    template: string,
    context: WorkflowExecutionContext
  ): string {
    let projectInfo = `# 项目信息\n\n- **项目路径**: ${context.projectPath}\n`;
    
    if (context.projectContext) {
      if (context.projectContext.techStack && context.projectContext.techStack.length > 0) {
        projectInfo += `- **技术栈**: ${context.projectContext.techStack.join(', ')}\n`;
      }
      if (context.projectContext.testFramework) {
        projectInfo += `- **测试框架**: ${context.projectContext.testFramework}\n`;
      }
      if (context.projectContext.e2eFramework) {
        projectInfo += `- **E2E框架**: ${context.projectContext.e2eFramework}\n`;
      }
    }
    
    let rendered = projectInfo + '\n---\n\n' + template;
    const hasPlaceholders = /{{[^}]+}}/g.test(template);
    const inputsUsed = new Set<string>();

    const currentStepOutput = context.outputs.length > 0 
      ? context.outputs[context.outputs.length - 1] 
      : null;
    const hasPreviousConversations = currentStepOutput && currentStepOutput.conversations.length > 0;

    for (const [key, value] of Object.entries(context.inputs)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      if (regex.test(rendered)) {
        inputsUsed.add(key);
        rendered = rendered.replace(regex, String(value || ''));
      }
    }

    if (rendered.includes('{{project_path}}')) {
      rendered = rendered.replace(/{{project_path}}/g, context.projectPath);
    }

    if (rendered.includes('{{tech_stack}}') && context.projectContext) {
      rendered = rendered.replace(
        /{{tech_stack}}/g,
        context.projectContext.techStack.join(', ')
      );
    }

    if (rendered.includes('{{test_framework}}') && context.projectContext) {
      rendered = rendered.replace(
        /{{test_framework}}/g,
        context.projectContext.testFramework || 'vitest'
      );
    }

    if (rendered.includes('{{e2e_framework}}') && context.projectContext) {
      rendered = rendered.replace(
        /{{e2e_framework}}/g,
        context.projectContext.e2eFramework || 'playwright'
      );
    }

    if (rendered.includes('{{git_diff}}')) {
      const diff = this.git.getDiff(false);
      rendered = rendered.replace(/{{git_diff}}/g, diff || '(无变更)');
    }

    if (rendered.includes('{{previous_output}}') && context.outputs.length > 0) {
      const previousStep = context.outputs[context.outputs.length - 1];
      const previousOutput = previousStep.conversations.length > 0 
        ? previousStep.conversations[previousStep.conversations.length - 1].response 
        : '';
      rendered = rendered.replace(/{{previous_output}}/g, previousOutput);
    }

    if (rendered.includes('{{all_changes}}')) {
      const allResponses = context.outputs
        .flatMap(o => o.conversations.map(c => c.response))
        .join('\n\n---\n\n');
      rendered = rendered.replace(/{{all_changes}}/g, allResponses);
    }

    if (rendered.includes('{{implemented_code}}')) {
      const implementStep = context.outputs.find(o => o.stepId === 'implement');
      const implementCode = implementStep?.conversations.length 
        ? implementStep.conversations[implementStep.conversations.length - 1].response 
        : '';
      rendered = rendered.replace(/{{implemented_code}}/g, implementCode);
    }

    if (rendered.includes('{{codebase_files}}') && context.inputs.relatedFiles) {
      const files = context.inputs.relatedFiles as string[];
      const filesContent = this.scanner.getFilesContent(files);
      const formatted = Object.entries(filesContent)
        .map(([path, content]) => `\n### ${path}\n\`\`\`\n${content}\n\`\`\``)
        .join('\n');
      rendered = rendered.replace(/{{codebase_files}}/g, formatted);
    }

    if (rendered.includes('{{related_files}}') && context.inputs.relatedFiles) {
      const files = context.inputs.relatedFiles as string[];
      rendered = rendered.replace(/{{related_files}}/g, files.join(', '));
    }

    const unusedInputs = Object.entries(context.inputs)
      .filter(([key]) => !inputsUsed.has(key) && !['relatedFilesInput', 'relatedFiles', 'continuationInput'].includes(key))
      .filter(([_, value]) => value && String(value).trim());

    const completedSteps = context.outputs.filter(o => o.completed);
    console.log(`[WorkflowEngine] 总共有 ${context.outputs.length} 个输出，其中 ${completedSteps.length} 个已完成`);
    completedSteps.forEach(o => {
      console.log(`  - ${o.stepName}: ${o.conversations.length} 轮对话`);
    });

    const MAX_STEP_TOKENS = 15000;
    const allPreviousSteps = completedSteps
      .map(o => {
        const allConversations = o.conversations
          .map((conv, idx) => {
            let text = `\n### 第 ${idx + 1} 轮对话\n`;
            if (conv.userInput && conv.userInput.trim() && conv.userInput !== '[系统自动总结]') {
              text += `**开发者**: ${conv.userInput}\n\n`;
            }
            text += `**Claude**: ${conv.response}\n`;
            return text;
          })
          .join('\n---\n');
        
        const estimatedTokens = Math.ceil(allConversations.length / 4);
        console.log(`  - ${o.stepName} tokens 估计: ${estimatedTokens}`);
        
        if (estimatedTokens > MAX_STEP_TOKENS) {
          const lastConv = o.conversations[o.conversations.length - 1];
          const summary = `\n### 总结\n该步骤共进行了 ${o.conversations.length} 轮对话。\n\n**最终结果**:\n${lastConv.response.substring(0, 3000)}${lastConv.response.length > 3000 ? '...\n\n[内容过长，已截断。如需完整内容，请查看对话历史]' : ''}`;
          console.log(`  - ${o.stepName} 内容过长，使用摘要`);
          return `\n## ${o.stepName}\n\n${summary}`;
        }
        
        return `\n## ${o.stepName}\n\n${allConversations}`;
      })
      .join('\n\n========\n\n');

    if (allPreviousSteps) {
      console.log(`[WorkflowEngine] 添加之前步骤的对话历史，长度: ${allPreviousSteps.length} 字符`);
      rendered = `${rendered}\n\n# 之前步骤的完整对话记录\n以下是工作流中已完成步骤的所有对话，请基于这些上下文继续工作：\n${allPreviousSteps}`;
    } else {
      console.log(`[WorkflowEngine] 没有之前步骤的对话历史`);
    }

    if (hasPreviousConversations) {
      const allCurrentConversations = currentStepOutput!.conversations
        .map((conv, index) => {
          let history = `\n### 第 ${index + 1} 轮对话\n`;
          if (conv.userInput && conv.userInput.trim()) {
            history += `\n**开发者**:\n${conv.userInput}\n`;
          }
          history += `\n**Claude 之前的回复**:\n${conv.response}\n`;
          return history;
        })
        .join('\n---\n');

      const currentConvTokens = Math.ceil(allCurrentConversations.length / 4);
      console.log(`[WorkflowEngine] 当前步骤对话历史 tokens 估计: ${currentConvTokens}`);

      let conversationHistory = allCurrentConversations;
      
      if (currentConvTokens > MAX_STEP_TOKENS) {
        const lastConv = currentStepOutput!.conversations[currentStepOutput!.conversations.length - 1];
        conversationHistory = `\n### 总结\n本步骤已进行了 ${currentStepOutput!.conversations.length} 轮对话。\n\n**最近一轮的完整内容**:\n\n**开发者**: ${lastConv.userInput || '(无输入)'}\n\n**Claude**: ${lastConv.response.substring(0, 3000)}${lastConv.response.length > 3000 ? '...\n\n[对话内容过长，已截断。完整历史可在界面查看]' : ''}`;
        console.log(`[WorkflowEngine] 当前步骤对话历史过长，使用摘要`);
      }

      rendered = `${rendered}\n\n# 对话历史\n以下是本步骤之前的对话记录，请基于这些上下文继续回答：\n${conversationHistory}`;

      if (context.inputs.continuationInput && String(context.inputs.continuationInput).trim()) {
        rendered += `\n\n---\n\n# 开发者的新要求\n${context.inputs.continuationInput}`;
      }
    } else if (unusedInputs.length > 0 && !hasPlaceholders) {
      const inputsSection = unusedInputs
        .map(([key, value]) => {
          const label = key === 'requirement' ? '需求描述' : 
                       key === 'bug_description' ? 'Bug描述' : 
                       key === 'target_code' ? '目标代码' : 
                       key === 'refactor_goal' ? '重构目标' : key;
          return `\n## ${label}\n${String(value)}`;
        })
        .join('\n');
      
      rendered = rendered + '\n\n---\n' + inputsSection;
    }

    return rendered;
  }

  async scanProject(): Promise<ProjectContext> {
    return await this.scanner.scan();
  }

  getGitStatus() {
    return this.git.getStatus();
  }

  async commitChanges(files: string[], message: string) {
    return await this.git.commitWithDiff(files, message);
  }
}
