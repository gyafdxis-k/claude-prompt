'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, materialLight, dracula, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const getLanguageStyle = (language: string) => {
  const langLower = language.toLowerCase();
  
  const styleMap: Record<string, any> = {
    python: oneDark,
    javascript: vscDarkPlus,
    typescript: vscDarkPlus,
    jsx: vscDarkPlus,
    tsx: vscDarkPlus,
    java: dracula,
    go: vscDarkPlus,
    rust: dracula,
    cpp: vscDarkPlus,
    c: vscDarkPlus,
    ruby: dracula,
    php: vscDarkPlus,
    swift: vscDarkPlus,
    kotlin: vscDarkPlus,
    sql: oneDark,
    bash: oneDark,
    shell: oneDark,
    json: vscDarkPlus,
    yaml: vscDarkPlus,
    xml: vscDarkPlus,
    html: vscDarkPlus,
    css: vscDarkPlus,
    scss: vscDarkPlus,
    markdown: materialLight,
  };
  
  return styleMap[langLower] || vscDarkPlus;
};

const getLanguageIcon = (language: string) => {
  const langLower = language.toLowerCase();
  
  const iconMap: Record<string, string> = {
    python: '🐍',
    javascript: '📜',
    typescript: '📘',
    jsx: '⚛️',
    tsx: '⚛️',
    java: '☕',
    go: '🔷',
    rust: '🦀',
    cpp: '⚙️',
    c: '⚙️',
    ruby: '💎',
    php: '🐘',
    swift: '🍎',
    kotlin: '🅺',
    sql: '🗄️',
    bash: '💻',
    shell: '💻',
    json: '📋',
    yaml: '📄',
    xml: '📄',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    markdown: '📝',
  };
  
  return iconMap[langLower] || '📄';
};

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({children}) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900">{children}</h1>,
          h2: ({children}) => <h2 className="text-xl font-bold mb-3 mt-5 text-gray-800">{children}</h2>,
          h3: ({children}) => <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-800">{children}</h3>,
          h4: ({children}) => <h4 className="text-base font-semibold mb-2 mt-3 text-gray-800">{children}</h4>,
          p: ({children}) => <p className="mb-3 leading-relaxed text-gray-700">{children}</p>,
          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700">{children}</ol>,
          li: ({children}) => <li className="ml-4">{children}</li>,
          blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-3">{children}</blockquote>,
          a: ({href, children}) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
          strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({children}) => <em className="italic text-gray-700">{children}</em>,
          hr: () => <hr className="my-6 border-gray-200" />,
          table: ({children}) => <table className="border-collapse border border-gray-300 my-4 w-full">{children}</table>,
          thead: ({children}) => <thead className="bg-gray-100">{children}</thead>,
          tbody: ({children}) => <tbody>{children}</tbody>,
          tr: ({children}) => <tr className="border-b border-gray-200">{children}</tr>,
          th: ({children}) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">{children}</th>,
          td: ({children}) => <td className="border border-gray-300 px-4 py-2 text-gray-700">{children}</td>,
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match;
            
            return isInline ? (
              <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative my-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-2 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getLanguageIcon(language)}</span>
                    <span className="text-gray-300 font-medium">{language || 'code'}</span>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="text-gray-300 hover:text-white transition-colors px-2 py-1 hover:bg-gray-600 rounded"
                  >
                    📋 复制
                  </button>
                </div>
                <SyntaxHighlighter
                  style={getLanguageStyle(language)}
                  language={language || 'text'}
                  PreTag="div"
                  className="!m-0 !rounded-none"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    tabSize: 2,
                    whiteSpace: 'pre'
                  }}
                  showLineNumbers={true}
                  wrapLongLines={false}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
