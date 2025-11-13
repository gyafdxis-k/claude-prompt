import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownRenderer from '../MarkdownRenderer';

vi.mock('react-syntax-highlighter', () => ({
  Prism: vi.fn(({ children, language, ...props }: any) => (
    <pre data-testid="syntax-highlighter" data-language={language} {...props}>
      <code>{children}</code>
    </pre>
  ))
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
  materialLight: {},
  dracula: {},
  oneDark: {}
}));

describe('MarkdownRenderer', () => {
  describe('basic rendering', () => {
    it('should render plain text', () => {
      render(<MarkdownRenderer content="Hello World" />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<MarkdownRenderer content="Test" className="custom-class" />);
      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });

    it('should render empty content', () => {
      const { container } = render(<MarkdownRenderer content="" />);
      expect(container.querySelector('.prose')).toBeInTheDocument();
    });
  });

  describe('headings', () => {
    it('should render h1 heading', () => {
      render(<MarkdownRenderer content="# Heading 1" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Heading 1');
      expect(heading).toHaveClass('text-2xl', 'font-bold');
    });

    it('should render h2 heading', () => {
      render(<MarkdownRenderer content="## Heading 2" />);
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Heading 2');
      expect(heading).toHaveClass('text-xl', 'font-bold');
    });

    it('should render h3 heading', () => {
      render(<MarkdownRenderer content="### Heading 3" />);
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Heading 3');
      expect(heading).toHaveClass('text-lg', 'font-semibold');
    });

    it('should render h4 heading', () => {
      render(<MarkdownRenderer content="#### Heading 4" />);
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Heading 4');
      expect(heading).toHaveClass('text-base', 'font-semibold');
    });

    it('should render multiple headings', () => {
      const content = `
# Title
## Subtitle
### Section
`;
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Subtitle');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Section');
    });
  });

  describe('text formatting', () => {
    it('should render paragraphs', () => {
      render(<MarkdownRenderer content="This is a paragraph." />);
      expect(screen.getByText('This is a paragraph.')).toBeInTheDocument();
    });

    it('should render bold text', () => {
      const { container } = render(<MarkdownRenderer content="**bold text**" />);
      const strong = container.querySelector('strong');
      expect(strong).toBeInTheDocument();
      expect(strong).toHaveClass('font-semibold');
      expect(strong?.textContent).toBe('bold text');
    });

    it('should render italic text', () => {
      const { container } = render(<MarkdownRenderer content="*italic text*" />);
      const em = container.querySelector('em');
      expect(em).toBeInTheDocument();
      expect(em).toHaveClass('italic');
      expect(em?.textContent).toBe('italic text');
    });

    it('should render combined formatting', () => {
      const { container } = render(<MarkdownRenderer content="**_bold italic_**" />);
      expect(container.textContent).toContain('bold italic');
    });
  });

  describe('lists', () => {
    it('should render unordered list', () => {
      const content = `
- Item 1
- Item 2
- Item 3
`;
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should render ordered list', () => {
      const content = `
1. First
2. Second
3. Third
`;
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('should render nested lists', () => {
      const content = `
- Item 1
  - Nested 1
  - Nested 2
- Item 2
`;
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Nested 1')).toBeInTheDocument();
    });
  });

  describe('links', () => {
    it('should render links', () => {
      render(<MarkdownRenderer content="[Link Text](https://example.com)" />);
      const link = screen.getByRole('link', { name: 'Link Text' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should style links', () => {
      render(<MarkdownRenderer content="[Link](https://example.com)" />);
      const link = screen.getByRole('link');
      expect(link).toHaveClass('text-blue-600', 'hover:underline');
    });
  });

  describe('blockquotes', () => {
    it('should render blockquotes', () => {
      render(<MarkdownRenderer content="> This is a quote" />);
      expect(screen.getByText('This is a quote')).toBeInTheDocument();
    });

    it('should style blockquotes', () => {
      const { container } = render(<MarkdownRenderer content="> Quote" />);
      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toHaveClass('border-l-4', 'italic');
    });
  });

  describe('horizontal rules', () => {
    it('should render horizontal rule', () => {
      const { container } = render(<MarkdownRenderer content="---" />);
      const hr = container.querySelector('hr');
      expect(hr).toBeInTheDocument();
      expect(hr).toHaveClass('my-6', 'border-gray-200');
    });
  });

  describe('tables', () => {
    it('should render tables', () => {
      const content = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Header 2')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 2')).toBeInTheDocument();
    });

    it('should render table with multiple rows', () => {
      const content = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
`;
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('inline code', () => {
    it('should render inline code', () => {
      const { container } = render(<MarkdownRenderer content="Use `const x = 1` in your code" />);
      const code = container.querySelector('code');
      expect(code).toBeInTheDocument();
      expect(code).toHaveClass('bg-gray-100', 'text-pink-600');
      expect(code?.textContent).toBe('const x = 1');
    });

    it('should render multiple inline code blocks', () => {
      const { container } = render(<MarkdownRenderer content="`var1` and `var2`" />);
      const codes = container.querySelectorAll('code');
      expect(codes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('code blocks', () => {
    it('should render code block without language', () => {
      const content = '```\nconst x = 1;\n```\n';
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.textContent).toContain('const x = 1');
    });

    it('should render code block with language', () => {
      const content = '```javascript\nconst x = 1;\n```\n';
      const { container } = render(<MarkdownRenderer content={content} />);
      const highlighter = container.querySelector('[data-testid="syntax-highlighter"]');
      expect(highlighter || screen.queryByTestId('syntax-highlighter')).toBeTruthy();
    });

    it('should show language label', () => {
      const content = '```python\nprint("hello")\n```\n';
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.textContent).toContain('python');
    });

    it('should show copy button', () => {
      const content = '```javascript\ncode\n```\n';
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.textContent).toContain('复制');
    });

    it('should copy code to clipboard on button click', async () => {
      const user = userEvent.setup();
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: writeTextMock
        },
        writable: true,
        configurable: true
      });

      const content = '```javascript\nconst x = 1;\n```\n';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      const copyButton = container.querySelector('button');
      if (copyButton) {
        await user.click(copyButton);
        expect(writeTextMock).toHaveBeenCalled();
      }
    });

    it('should support multiple languages', () => {
      const languages = ['python', 'typescript', 'java', 'go', 'rust'];
      languages.forEach(lang => {
        const content = `\`\`\`${lang}\ncode\n\`\`\``;
        const { container } = render(<MarkdownRenderer content={content} />);
        expect(screen.getByText(lang)).toBeInTheDocument();
        container.remove();
      });
    });
  });

  describe('GFM support', () => {
    it('should render strikethrough', () => {
      const { container } = render(<MarkdownRenderer content="~~strikethrough~~" />);
      expect(container.textContent).toContain('strikethrough');
    });

    it('should render task lists', () => {
      const content = `
- [x] Completed task
- [ ] Incomplete task
`;
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.textContent).toContain('Completed task');
      expect(container.textContent).toContain('Incomplete task');
    });

    it('should render autolinks', () => {
      render(<MarkdownRenderer content="https://example.com" />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });

  describe('complex content', () => {
    it('should render mixed content', () => {
      const content = `
# Title
This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

\`inline code\` and [link](https://example.com)

\`\`\`javascript
const x = 1;
\`\`\`
`;
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
      expect(container.textContent).toContain('This is a paragraph');
      expect(container.textContent).toContain('List item 1');
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const content = 'Special chars: < > & " \'';
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByText(/Special chars:/)).toBeInTheDocument();
    });

    it('should handle empty lines', () => {
      const content = `
Line 1


Line 2
`;
      render(<MarkdownRenderer content={content} />);
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
    });
  });
});
