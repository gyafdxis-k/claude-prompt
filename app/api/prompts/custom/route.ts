import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: Request) {
  try {
    const template = await request.json();
    
    const customPromptsDir = path.join(process.cwd(), 'prompts', 'Custom');
    
    if (!fs.existsSync(customPromptsDir)) {
      fs.mkdirSync(customPromptsDir, { recursive: true });
    }
    
    const filename = `${template.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    const filepath = path.join(customPromptsDir, filename);
    
    const fileContent = `# ${template.name}

${template.description}

## Content

${template.content}
`;
    
    fs.writeFileSync(filepath, fileContent, 'utf-8');
    
    return NextResponse.json({ success: true, path: filepath });
  } catch (error: any) {
    console.error('[Custom Prompt API] 保存失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
