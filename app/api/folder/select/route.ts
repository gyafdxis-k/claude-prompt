import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const script = `osascript -e 'POSIX path of (choose folder with prompt "选择项目文件夹")'`;
    
    const { stdout, stderr } = await execAsync(script);
    
    if (stderr) {
      console.error('[Folder Selector] stderr:', stderr);
    }
    
    const folderPath = stdout.trim();
    
    if (!folderPath) {
      return NextResponse.json({ error: '未选择文件夹' }, { status: 400 });
    }
    
    return NextResponse.json({ path: folderPath });
  } catch (error: any) {
    console.error('[Folder Selector] 选择失败:', error);
    
    if (error.message.includes('User canceled')) {
      return NextResponse.json({ error: '用户取消选择' }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
