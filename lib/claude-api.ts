import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  private client: Anthropic | null = null;

  initialize(apiKey?: string) {
    const authToken = apiKey || 
                      process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN || 
                      process.env.ANTHROPIC_AUTH_TOKEN || 
                      process.env.ANTHROPIC_API_KEY;
    
    const baseURL = process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL || 
                    process.env.ANTHROPIC_BASE_URL;
    
    console.log('[Claude Service] 初始化...');
    console.log('[Claude Service] API Key:', authToken ? `${authToken.substring(0, 10)}...` : '未配置');
    console.log('[Claude Service] Base URL:', baseURL || '默认');
    
    if (!authToken) {
      throw new Error('需要提供 API Key 或设置环境变量 ANTHROPIC_AUTH_TOKEN');
    }

    this.client = new Anthropic({ 
      apiKey: authToken,
      baseURL: baseURL || undefined,
      dangerouslyAllowBrowser: true 
    });
    
    console.log('[Claude Service] 初始化成功');
  }

  async sendMessage(
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Claude API 未初始化，请先设置 API Key');
    }

    const response = await this.client.messages.create({
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 8192,
      temperature: options?.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return '';
  }

  async *streamMessage(
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): AsyncGenerator<string, void, unknown> {
    console.log('[Claude Service] streamMessage 开始');
    console.log('[Claude Service] Prompt长度:', prompt.length);
    
    if (!this.client) {
      throw new Error('Claude API 未初始化，请先设置 API Key');
    }

    const model = options?.model || 'claude-sonnet-4-20250514';
    const maxTokens = options?.maxTokens || 
                      parseInt(process.env.NEXT_PUBLIC_CLAUDE_CODE_MAX_OUTPUT_TOKENS || '8192');
    
    console.log('[Claude Service] 模型:', model);
    console.log('[Claude Service] Max Tokens:', maxTokens);

    try {
      const stream = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: options?.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true
      });

      console.log('[Claude Service] 流式响应开始');
      let totalChunks = 0;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          totalChunks++;
          yield event.delta.text;
        }
      }
      
      console.log('[Claude Service] 流式响应完成, 总块数:', totalChunks);
    } catch (error: any) {
      console.error('[Claude Service] 流式响应错误:', error.message);
      console.error('[Claude Service] 错误详情:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.client !== null;
  }
}

export const claudeService = new ClaudeService();
