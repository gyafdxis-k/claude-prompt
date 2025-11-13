import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StreamingDisplay from '../StreamingDisplay';

vi.mock('../MarkdownRenderer', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown-renderer">{content}</div>
}));

describe('StreamingDisplay', () => {
  describe('visibility', () => {
    it('should return null when not streaming and no response', () => {
      const { container } = render(
        <StreamingDisplay 
          response="" 
          isStreaming={false} 
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when streaming', () => {
      render(
        <StreamingDisplay 
          response="" 
          isStreaming={true} 
        />
      );
      expect(screen.getByText('🧠 Claude 思考中...')).toBeInTheDocument();
    });

    it('should render when has response', () => {
      render(
        <StreamingDisplay 
          response="Test response" 
          isStreaming={false} 
        />
      );
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });

  describe('header', () => {
    it('should show header title', () => {
      render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true} 
        />
      );
      expect(screen.getByText('🧠 Claude 思考中...')).toBeInTheDocument();
    });

    it('should show streaming indicator when streaming', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true} 
        />
      );
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(3);
    });

    it('should not show streaming indicator when not streaming', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={false} 
        />
      );
      const dots = container.querySelectorAll('.animate-bounce');
      expect(dots.length).toBe(0);
    });

    it('should show task step name in header', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
          taskInfo={{
            stepName: 'Step 1',
            description: 'Test step'
          }}
        />
      );
      expect(container.textContent).toContain('Step 1');
    });
  });

  describe('task info panel', () => {
    it('should show task info when provided', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
          taskInfo={{
            stepName: 'Data Processing',
            description: 'Processing user data'
          }}
        />
      );
      expect(screen.getByText('📋 当前任务')).toBeInTheDocument();
      expect(container.textContent).toContain('Data Processing');
      expect(container.textContent).toContain('Processing user data');
    });

    it('should show all task info fields', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
          taskInfo={{
            stepName: 'Build',
            description: 'Building project',
            projectPath: '/path/to/project'
          }}
        />
      );
      expect(container.textContent).toContain('Build');
      expect(container.textContent).toContain('Building project');
      expect(container.textContent).toContain('/path/to/project');
    });

    it('should not show project path when not provided', () => {
      render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
          taskInfo={{
            stepName: 'Step',
            description: 'Description'
          }}
        />
      );
      expect(screen.queryByText('项目：')).not.toBeInTheDocument();
    });

    it('should not show description when not provided', () => {
      render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
          taskInfo={{
            stepName: 'Step',
            description: ''
          }}
        />
      );
      expect(screen.queryByText('描述：')).not.toBeInTheDocument();
    });

    it('should show prompt when no taskInfo', () => {
      render(
        <StreamingDisplay 
          prompt="Test prompt"
          response="Test" 
          isStreaming={true}
        />
      );
      expect(screen.getByText('Test prompt')).toBeInTheDocument();
    });

    it('should not show prompt when taskInfo is provided', () => {
      render(
        <StreamingDisplay 
          prompt="Test prompt"
          response="Test" 
          isStreaming={true}
          taskInfo={{
            stepName: 'Step',
            description: 'Description'
          }}
        />
      );
      expect(screen.queryByText('Test prompt')).not.toBeInTheDocument();
    });

    it('should not show task panel when no prompt and no taskInfo', () => {
      render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      expect(screen.queryByText('📋 当前任务')).not.toBeInTheDocument();
    });
  });

  describe('response display', () => {
    it('should render response with MarkdownRenderer', () => {
      render(
        <StreamingDisplay 
          response="# Test Response" 
          isStreaming={false}
        />
      );
      expect(screen.getByTestId('markdown-renderer')).toHaveTextContent('# Test Response');
    });

    it('should show response header', () => {
      render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={false}
        />
      );
      expect(screen.getByText('📥 响应')).toBeInTheDocument();
    });

    it('should show cursor when streaming', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      expect(container.textContent).toContain('▊');
    });

    it('should not show cursor when not streaming', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={false}
        />
      );
      expect(container.textContent).not.toContain('▊');
    });

    it('should render empty response', () => {
      render(
        <StreamingDisplay 
          response="" 
          isStreaming={true}
        />
      );
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    });

    it('should render long response', () => {
      const longResponse = 'A'.repeat(10000);
      render(
        <StreamingDisplay 
          response={longResponse} 
          isStreaming={false}
        />
      );
      expect(screen.getByTestId('markdown-renderer')).toHaveTextContent(longResponse);
    });
  });

  describe('layout', () => {
    it('should use split layout when prompt is provided', () => {
      const { container } = render(
        <StreamingDisplay 
          prompt="Test prompt"
          response="Test" 
          isStreaming={true}
        />
      );
      const responsePanel = container.querySelector('.w-2\\/3');
      expect(responsePanel).toBeInTheDocument();
    });

    it('should use full width when no prompt or taskInfo', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      const responsePanel = container.querySelector('.w-full');
      expect(responsePanel).toBeInTheDocument();
    });

    it('should have fixed positioning', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      const mainDiv = container.querySelector('.fixed');
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv).toHaveClass('inset-4');
    });

    it('should have high z-index', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      const mainDiv = container.querySelector('.z-50');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should be scrollable', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      const scrollableDiv = container.querySelector('.overflow-y-auto');
      expect(scrollableDiv).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have blue border and shadow', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      const mainDiv = container.querySelector('.border-2');
      expect(mainDiv).toHaveClass('border-blue-500', 'shadow-2xl');
    });

    it('should have blue header background', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      const header = container.querySelector('.bg-blue-600');
      expect(header).toBeInTheDocument();
    });

    it('should have rounded corners', () => {
      const { container } = render(
        <StreamingDisplay 
          response="Test" 
          isStreaming={true}
        />
      );
      const mainDiv = container.querySelector('.rounded-lg');
      expect(mainDiv).toBeInTheDocument();
    });
  });

  describe('integration', () => {
    it('should handle all props together', () => {
      const { container } = render(
        <StreamingDisplay 
          prompt="Input prompt"
          response="Output response"
          isStreaming={true}
          taskInfo={{
            stepName: 'Processing',
            description: 'Processing data',
            projectPath: '/project'
          }}
        />
      );
      expect(container.textContent).toContain('Processing');
      expect(container.textContent).toContain('Processing data');
      expect(container.textContent).toContain('/project');
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    });

    it('should handle minimal props', () => {
      render(
        <StreamingDisplay 
          response="Response only"
          isStreaming={false}
        />
      );
      expect(screen.getByText('Response only')).toBeInTheDocument();
      expect(screen.queryByText('📋 当前任务')).not.toBeInTheDocument();
    });

    it('should handle state transition from streaming to complete', () => {
      const { rerender, container } = render(
        <StreamingDisplay 
          response="Loading"
          isStreaming={true}
        />
      );
      
      expect(container.textContent).toContain('▊');
      
      rerender(
        <StreamingDisplay 
          response="Loading... Complete!"
          isStreaming={false}
        />
      );
      
      expect(container.textContent).not.toContain('▊');
    });
  });
});
