import { Workflow, WorkflowStep } from './workflow-templates';
import { ClaudeService } from '../claude-api';
import { ProjectScanner, ProjectContext } from '../context/project-scanner';
import { GitService } from '../git/git-service';

export interface StepOutput {
  stepId: string;
  stepName: string;
  prompt: string;
  response: string;
  timestamp: number;
  approved?: boolean;
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

  private renderPrompt(
    template: string,
    context: WorkflowExecutionContext
  ): string {
    let rendered = template;

    for (const [key, value] of Object.entries(context.inputs)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
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
      const previousOutput = context.outputs[context.outputs.length - 1].response;
      rendered = rendered.replace(/{{previous_output}}/g, previousOutput);
    }

    if (rendered.includes('{{all_changes}}')) {
      const allResponses = context.outputs.map(o => o.response).join('\n\n---\n\n');
      rendered = rendered.replace(/{{all_changes}}/g, allResponses);
    }

    if (rendered.includes('{{implemented_code}}')) {
      const implementStep = context.outputs.find(o => o.stepId === 'implement');
      rendered = rendered.replace(
        /{{implemented_code}}/g,
        implementStep?.response || ''
      );
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
