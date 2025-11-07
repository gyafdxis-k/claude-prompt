import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/lib/git/git-service';

export async function POST(request: NextRequest) {
  try {
    const { projectPath, files, message } = await request.json();

    if (!projectPath || !message) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const git = new GitService(projectPath);
    
    if (!git.isGitRepo()) {
      return NextResponse.json(
        { error: '不是Git仓库' },
        { status: 400 }
      );
    }

    const result = await git.commitWithDiff(files || [], message);

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
