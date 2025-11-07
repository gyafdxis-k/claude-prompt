'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatPanelProps {
  messages: Message[];
  isStreaming?: boolean;
}

export default function ChatPanel({ messages, isStreaming }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg">选择模版并填写表单开始对话</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${
              message.role === 'user' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-gray-200'
            } border rounded-lg p-4`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`font-semibold ${
                  message.role === 'user' ? 'text-blue-800' : 'text-gray-800'
                }`}>
                  {message.role === 'user' ? '👤 你' : '🤖 Claude'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
                </div>
              </div>
              
              <button
                onClick={() => copyToClipboard(message.content)}
                className="text-gray-400 hover:text-gray-600 text-sm"
                title="复制"
              >
                📋
              </button>
            </div>
            
            <div className="prose prose-sm max-w-none">
              {message.role === 'user' ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {message.content}
                </pre>
              ) : (
                <ReactMarkdown
                  components={{
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match;
                      
                      return isInline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                          <button
                            onClick={() => copyToClipboard(String(children))}
                            className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                          >
                            复制代码
                          </button>
                        </div>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        
        {isStreaming && (
          <div className="flex items-center gap-2 text-gray-500">
            <div className="animate-pulse">正在生成回复...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
