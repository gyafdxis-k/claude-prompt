import { PromptTemplate, Variable } from './templates/templates';

export class TemplateEngine {
  render(template: PromptTemplate, values: Record<string, any>): string {
    let result = template.template;
    
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    
    return result;
  }

  validate(template: PromptTemplate, values: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const variable of template.variables) {
      if (variable.required && !values[variable.name]) {
        errors.push(`${variable.label} 是必填项`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  getVariableDefaults(template: PromptTemplate): Record<string, string> {
    const defaults: Record<string, string> = {};
    
    for (const variable of template.variables) {
      if (variable.default) {
        defaults[variable.name] = variable.default;
      }
    }
    
    return defaults;
  }
}

export const templateEngine = new TemplateEngine();
