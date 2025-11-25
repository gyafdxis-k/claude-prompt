export const CLAUDE_CONFIG = {
  DEFAULT_MODEL: process.env.NEXT_PUBLIC_CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  DEFAULT_MAX_TOKENS: parseInt(process.env.NEXT_PUBLIC_MAX_TOKENS || '4096'),
  DEFAULT_TEMPERATURE: parseFloat(process.env.NEXT_PUBLIC_TEMPERATURE || '0.7'),
  
  MAX_TOKENS_LIMIT: 100000,
  SUMMARY_MAX_TOKENS: 2000,
  SUMMARY_CONTEXT_LENGTH: 10000,
  
  CHARS_PER_TOKEN: 4,
} as const;

export const EXTERNAL_URLS = {
  ANTHROPIC_CONSOLE: 'https://console.anthropic.com/',
  ANTHROPIC_DOCS: 'https://docs.anthropic.com/',
} as const;
