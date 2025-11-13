import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeService } from '../claude-api';
import Anthropic from '@anthropic-ai/sdk';

vi.mock('@anthropic-ai/sdk');

describe('ClaudeService', () => {
  let service: ClaudeService;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClaudeService();
    
    mockClient = {
      messages: {
        create: vi.fn()
      }
    };
    
    (Anthropic as any).mockImplementation(function() {
      return mockClient;
    });
    
    process.env.ANTHROPIC_AUTH_TOKEN = 'test-token';
  });

  describe('initialize', () => {
    it('should initialize with provided API key', () => {
      service.initialize('custom-api-key');
      expect(service.isInitialized()).toBe(true);
      expect(Anthropic).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'custom-api-key',
        dangerouslyAllowBrowser: true
      }));
    });

    it('should initialize with environment variable', () => {
      service.initialize();
      expect(service.isInitialized()).toBe(true);
      expect(Anthropic).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'test-token',
        dangerouslyAllowBrowser: true
      }));
    });

    it('should use custom base URL from environment', () => {
      process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL = 'https://custom.api.com';
      service.initialize();
      expect(Anthropic).toHaveBeenCalledWith({
        apiKey: 'test-token',
        baseURL: 'https://custom.api.com',
        dangerouslyAllowBrowser: true
      });
    });

    it('should throw error when no API key is provided', () => {
      delete process.env.ANTHROPIC_AUTH_TOKEN;
      delete process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN;
      delete process.env.ANTHROPIC_API_KEY;
      
      expect(() => service.initialize()).toThrow('需要提供 API Key 或设置环境变量 ANTHROPIC_AUTH_TOKEN');
    });

    it('should prioritize provided API key over environment', () => {
      process.env.ANTHROPIC_AUTH_TOKEN = 'env-token';
      service.initialize('custom-token');
      
      expect(Anthropic).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'custom-token' })
      );
    });

    it('should check multiple environment variable names', () => {
      delete process.env.ANTHROPIC_AUTH_TOKEN;
      process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN = 'next-token';
      
      service.initialize();
      expect(Anthropic).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'next-token' })
      );
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(service.isInitialized()).toBe(false);
    });

    it('should return true after initialization', () => {
      service.initialize('test-key');
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      service.initialize('test-key');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new ClaudeService();
      await expect(uninitializedService.sendMessage('test')).rejects.toThrow(
        'Claude API 未初始化，请先设置 API Key'
      );
    });

    it('should send message and return text response', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Test response' }]
      };
      mockClient.messages.create.mockResolvedValue(mockResponse);

      const response = await service.sendMessage('Test prompt');
      
      expect(response).toBe('Test response');
      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        temperature: 0.7,
        messages: [{ role: 'user', content: 'Test prompt' }]
      });
    });

    it('should use custom options', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }]
      };
      mockClient.messages.create.mockResolvedValue(mockResponse);

      await service.sendMessage('Test', {
        model: 'claude-3-opus-20240229',
        maxTokens: 4096,
        temperature: 0.5
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        temperature: 0.5,
        messages: [{ role: 'user', content: 'Test' }]
      });
    });

    it('should return empty string for non-text content', async () => {
      const mockResponse = {
        content: [{ type: 'image', data: 'image-data' }]
      };
      mockClient.messages.create.mockResolvedValue(mockResponse);

      const response = await service.sendMessage('Test');
      expect(response).toBe('');
    });

    it('should handle API errors', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('API Error'));

      await expect(service.sendMessage('Test')).rejects.toThrow('API Error');
    });
  });

  describe('streamMessage', () => {
    beforeEach(() => {
      service.initialize('test-key');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedService = new ClaudeService();
      const generator = uninitializedService.streamMessage('test');
      
      await expect(generator.next()).rejects.toThrow(
        'Claude API 未初始化，请先设置 API Key'
      );
    });

    it('should stream text chunks', async () => {
      const mockStream = [
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello' } },
        { type: 'content_block_delta', delta: { type: 'text_delta', text: ' World' } },
        { type: 'message_stop' }
      ];
      
      mockClient.messages.create.mockResolvedValue(
        (async function* () {
          for (const event of mockStream) {
            yield event;
          }
        })()
      );

      const chunks: string[] = [];
      for await (const chunk of service.streamMessage('Test')) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' World']);
    });

    it('should use default model and tokens', async () => {
      const mockStream = [{ type: 'message_stop' }];
      mockClient.messages.create.mockResolvedValue(
        (async function* () {
          for (const event of mockStream) {
            yield event;
          }
        })()
      );

      const generator = service.streamMessage('Test');
      await generator.next();

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          temperature: 0.7,
          stream: true
        })
      );
    });

    it('should use custom options', async () => {
      const mockStream = [{ type: 'message_stop' }];
      mockClient.messages.create.mockResolvedValue(
        (async function* () {
          for (const event of mockStream) {
            yield event;
          }
        })()
      );

      const generator = service.streamMessage('Test', {
        model: 'claude-3-opus-20240229',
        maxTokens: 4096,
        temperature: 0.5
      });
      await generator.next();

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          temperature: 0.5
        })
      );
    });

    it('should handle tools in request', async () => {
      const mockStream = [{ type: 'message_stop' }];
      mockClient.messages.create.mockResolvedValue(
        (async function* () {
          for (const event of mockStream) {
            yield event;
          }
        })()
      );

      const tools = [
        { name: 'test_tool', description: 'Test', input_schema: {} }
      ];

      const generator = service.streamMessage('Test', { tools });
      await generator.next();

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({ tools })
      );
    });

    it('should handle tool use events', async () => {
      const onToolUse = vi.fn().mockResolvedValue({ result: 'tool result' });
      const onToolCall = vi.fn();

      const mockStream = [
        { 
          type: 'content_block_start', 
          content_block: { 
            type: 'tool_use', 
            id: 'tool-1', 
            name: 'test_tool' 
          } 
        },
        { 
          type: 'content_block_delta', 
          delta: { 
            type: 'input_json_delta', 
            partial_json: '{"param": "value"}' 
          } 
        },
        { type: 'message_stop' }
      ];

      let callCount = 0;
      mockClient.messages.create.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return (async function* () {
            for (const event of mockStream) {
              yield event;
            }
          })();
        } else {
          return (async function* () {
            yield { type: 'message_stop' };
          })();
        }
      });

      const chunks: string[] = [];
      for await (const chunk of service.streamMessage('Test', { 
        tools: [{ name: 'test_tool', description: 'Test', input_schema: {} }],
        onToolUse,
        onToolCall
      })) {
        chunks.push(chunk);
      }

      expect(onToolUse).toHaveBeenCalledWith('test_tool', { param: 'value' });
      expect(onToolCall).toHaveBeenCalledWith({
        tool: 'test_tool',
        params: { param: 'value' },
        result: { result: 'tool result' }
      });
    });

    it('should handle tool use errors', async () => {
      const onToolUse = vi.fn().mockRejectedValue(new Error('Tool error'));
      const onToolCall = vi.fn();

      const mockStream = [
        { 
          type: 'content_block_start', 
          content_block: { 
            type: 'tool_use', 
            id: 'tool-1', 
            name: 'test_tool' 
          } 
        },
        { 
          type: 'content_block_delta', 
          delta: { 
            type: 'input_json_delta', 
            partial_json: '{"param": "value"}' 
          } 
        },
        { type: 'message_stop' }
      ];

      let callCount = 0;
      mockClient.messages.create.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return (async function* () {
            for (const event of mockStream) {
              yield event;
            }
          })();
        } else {
          return (async function* () {
            yield { type: 'message_stop' };
          })();
        }
      });

      for await (const _ of service.streamMessage('Test', { 
        tools: [{ name: 'test_tool', description: 'Test', input_schema: {} }],
        onToolUse,
        onToolCall
      })) {
      }

      expect(onToolCall).toHaveBeenCalledWith({
        tool: 'test_tool',
        params: { param: 'value' },
        error: 'Tool error'
      });
    });

    it('should handle streaming errors', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('Stream error'));

      const generator = service.streamMessage('Test');
      
      await expect(generator.next()).rejects.toThrow('Stream error');
    });

    it('should use environment variable for max tokens', async () => {
      process.env.NEXT_PUBLIC_CLAUDE_CODE_MAX_OUTPUT_TOKENS = '16384';
      
      const mockStream = [{ type: 'message_stop' }];
      mockClient.messages.create.mockResolvedValue(
        (async function* () {
          for (const event of mockStream) {
            yield event;
          }
        })()
      );

      const generator = service.streamMessage('Test');
      await generator.next();

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 16384
        })
      );
    });

    it('should accumulate text before tool use', async () => {
      const onToolUse = vi.fn().mockResolvedValue({ result: 'ok' });

      const mockStream = [
        { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Before tool' } },
        { 
          type: 'content_block_start', 
          content_block: { type: 'tool_use', id: 'tool-1', name: 'test_tool' } 
        },
        { 
          type: 'content_block_delta', 
          delta: { type: 'input_json_delta', partial_json: '{}' } 
        },
        { type: 'message_stop' }
      ];

      let callCount = 0;
      mockClient.messages.create.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return (async function* () {
            for (const event of mockStream) {
              yield event;
            }
          })();
        } else {
          return (async function* () {
            yield { type: 'message_stop' };
          })();
        }
      });

      const chunks: string[] = [];
      for await (const chunk of service.streamMessage('Test', { 
        tools: [{ name: 'test_tool', description: 'Test', input_schema: {} }],
        onToolUse
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Before tool']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', async () => {
      service.initialize('test-key');
      const mockResponse = {
        content: [{ type: 'text', text: '' }]
      };
      mockClient.messages.create.mockResolvedValue(mockResponse);

      const response = await service.sendMessage('');
      expect(response).toBe('');
    });

    it('should handle very long prompts', async () => {
      service.initialize('test-key');
      const longPrompt = 'a'.repeat(100000);
      const mockResponse = {
        content: [{ type: 'text', text: 'Response' }]
      };
      mockClient.messages.create.mockResolvedValue(mockResponse);

      await service.sendMessage(longPrompt);
      expect(mockClient.messages.create).toHaveBeenCalled();
    });

    it('should handle multiple initializations', () => {
      service.initialize('key1');
      expect(service.isInitialized()).toBe(true);
      
      service.initialize('key2');
      expect(service.isInitialized()).toBe(true);
    });
  });
});
