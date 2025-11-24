import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const script = `osascript -e 'POSIX path of (choose folder with prompt "选择项目文件夹")'`;
    
    const { stdout, stderr } = await execAsync(script);
    
    if (stderr && !stderr.includes('CATransaction')) {
      console.error('[Folder Selector] stderr:', stderr);
    }
    
    const folderPath = stdout.trim();
    
    if (!folderPath) {
      return NextResponse.json({ error: '未选择文件夹' }, { status: 400 });
    }
    
    return NextResponse.json({ path: folderPath });
  } catch (error: any) {
    // 用户取消选择，返回 200 而不是错误
    if (error.message.includes('User canceled') || error.message.includes('用户已取消') || error.code === 128) {
      console.log('[Folder Selector] 用户取消选择');
      return NextResponse.json({ cancelled: true }, { status: 200 });
    }
    
    console.error('[Folder Selector] 选择失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
