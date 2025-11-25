import { Workflow, WorkflowStep } from './workflow-templates';
import { ClaudeService } from '../claude-api';
import { ProjectScanner, ProjectContext } from '../context/project-scanner';
import { GitService } from '../git/git-service';
import { CLAUDE_CONFIG } from '../config/claude';
import { WORKFLOW_LIMITS } from '../config/workflow';

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
    }

    const output: StepOutput = {
      stepId: step.id,
      stepName: step.name,
      conversations: [{
        prompt,
        response,
        timestamp: Date.now()
      }],
      completed: false
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
    return Math.ceil(text.length / CLAUDE_CONFIG.CHARS_PER_TOKEN);
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

    const MAX_STEP_TOKENS = WORKFLOW_LIMITS.MAX_STEP_TOKENS;
    const MAX_TOTAL_HISTORY = WORKFLOW_LIMITS.MAX_TOTAL_HISTORY;
    
    const allPreviousSteps = completedSteps
      .map(o => {
        // 只保留最后一轮对话的摘要
        const lastConv = o.conversations[o.conversations.length - 1];
        const summary = `\n## ${o.stepName}\n${o.conversations.length > 1 ? `共 ${o.conversations.length} 轮对话，` : ''}最终输出:\n${lastConv.response.substring(0, WORKFLOW_LIMITS.RESPONSE_TRUNCATE_LENGTH)}${lastConv.response.length > WORKFLOW_LIMITS.RESPONSE_TRUNCATE_LENGTH ? '...(已截断)' : ''}`;
        
        return summary;
      })
      .join('\n\n');
    
    // 如果总历史太长，进一步截断
    let finalPreviousSteps = allPreviousSteps;
    if (allPreviousSteps.length > MAX_TOTAL_HISTORY) {
      console.log(`[WorkflowEngine] 历史记录过长(${allPreviousSteps.length}字符)，截断到${MAX_TOTAL_HISTORY}字符`);
      finalPreviousSteps = allPreviousSteps.substring(0, MAX_TOTAL_HISTORY) + '\n\n...(更早的历史已省略)';
    }

    if (finalPreviousSteps) {
      console.log(`[WorkflowEngine] 添加之前步骤的对话历史，长度: ${finalPreviousSteps.length} 字符`);
      rendered = `${rendered}\n\n# 之前步骤摘要\n以下是已完成步骤的关键输出：\n${finalPreviousSteps}`;
    } else {
      console.log(`[WorkflowEngine] 没有之前步骤的对话历史`);
    }

    if (hasPreviousConversations) {
      const recentConversations = currentStepOutput!.conversations.slice(-WORKFLOW_LIMITS.MAX_CONVERSATION_DISPLAY);
      const conversationHistory = recentConversations
        .map((conv, index) => {
          const actualIndex = currentStepOutput!.conversations.length - recentConversations.length + index;
          let history = `\n### 第 ${actualIndex + 1} 轮\n`;
          if (conv.userInput && conv.userInput.trim()) {
            history += `开发者: ${conv.userInput.substring(0, WORKFLOW_LIMITS.USER_INPUT_TRUNCATE_LENGTH)}${conv.userInput.length > WORKFLOW_LIMITS.USER_INPUT_TRUNCATE_LENGTH ? '...' : ''}\n\n`;
          }
          history += `Claude: ${conv.response.substring(0, WORKFLOW_LIMITS.HISTORY_RESPONSE_LENGTH)}${conv.response.length > WORKFLOW_LIMITS.HISTORY_RESPONSE_LENGTH ? '...(已截断)' : ''}`;
          return history;
        })
        .join('\n---\n');

      console.log(`[WorkflowEngine] 当前步骤对话历史: 保留最近${recentConversations.length}轮，共${conversationHistory.length}字符`);

      rendered = `${rendered}\n\n# 最近对话\n${currentStepOutput!.conversations.length > 3 ? `(共${currentStepOutput!.conversations.length}轮，仅显示最近3轮)\n` : ''}${conversationHistory}`;

      if (context.inputs.continuationInput && String(context.inputs.continuationInput).trim()) {
        rendered += `\n\n---\n\n# 新要求\n${context.inputs.continuationInput}`;
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
