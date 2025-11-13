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
      tools?: any[];
      onToolUse?: (toolName: string, toolInput: any) => Promise<any>;
      onToolCall?: (toolCall: { tool: string; params: any; result?: any; error?: string }) => void;
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
      const messages: any[] = [
        {
          role: 'user',
          content: prompt
        }
      ];

      let continueLoop = true;

      while (continueLoop) {
        const requestParams: any = {
          model,
          max_tokens: maxTokens,
          temperature: options?.temperature || 0.7,
          messages,
          stream: true
        };

        if (options?.tools && options.tools.length > 0) {
          requestParams.tools = options.tools;
        }

        const stream = await this.client.messages.create(requestParams);

        console.log('[Claude Service] 流式响应开始');
        let totalChunks = 0;
        let currentText = '';
        let toolUses: any[] = [];

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            totalChunks++;
            currentText += event.delta.text;
            yield event.delta.text;
          } else if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
            console.log('[Claude Service] Tool use started:', event.content_block.name);
            toolUses.push({
              id: event.content_block.id,
              name: event.content_block.name,
              input: {}
            });
          } else if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
            const lastTool = toolUses[toolUses.length - 1];
            if (lastTool) {
              const inputStr = JSON.stringify(lastTool.input) + event.delta.partial_json;
              try {
                lastTool.input = JSON.parse(inputStr);
              } catch {
                lastTool.inputPartial = (lastTool.inputPartial || '') + event.delta.partial_json;
              }
            }
          } else if (event.type === 'message_stop') {
            continueLoop = false;
          }
        }

        console.log('[Claude Service] 流式响应完成, 总块数:', totalChunks);

        if (toolUses.length > 0 && options?.onToolUse) {
          console.log('[Claude Service] 执行工具调用:', toolUses.length);
          
          messages.push({
            role: 'assistant',
            content: [
              ...(currentText ? [{ type: 'text', text: currentText }] : []),
              ...toolUses.map(tool => ({
                type: 'tool_use',
                id: tool.id,
                name: tool.name,
                input: tool.inputPartial ? JSON.parse(tool.inputPartial) : tool.input
              }))
            ]
          });

          const toolResults = [];
          for (const tool of toolUses) {
            try {
              const input = tool.inputPartial ? JSON.parse(tool.inputPartial) : tool.input;
              const result = await options.onToolUse(tool.name, input);
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tool.id,
                content: JSON.stringify(result)
              });
              
              if (options.onToolCall) {
                options.onToolCall({
                  tool: tool.name,
                  params: input,
                  result
                });
              }
            } catch (error: any) {
              toolResults.push({
                type: 'tool_result',
                tool_use_id: tool.id,
                content: `Error: ${error.message}`,
                is_error: true
              });
              
              if (options.onToolCall) {
                options.onToolCall({
                  tool: tool.name,
                  params: tool.inputPartial ? JSON.parse(tool.inputPartial) : tool.input,
                  error: error.message
                });
              }
            }
          }

          messages.push({
            role: 'user',
            content: toolResults
          });

          continueLoop = true;
        } else {
          continueLoop = false;
        }
      }
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
