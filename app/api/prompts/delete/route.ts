import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { id, name, source } = await request.json();
    
    if (source !== 'custom') {
      return NextResponse.json({ error: '只能删除自定义模板' }, { status: 400 });
    }
    
    const customPromptsDir = path.join(process.cwd(), 'prompts', 'Custom');
    const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.md`;
    const filepath = path.join(customPromptsDir, filename);
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('[Delete Prompt API] 删除失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
