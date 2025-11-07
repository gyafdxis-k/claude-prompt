import { NextRequest, NextResponse } from 'next/server';
import { GitService } from '@/lib/git/git-service';

export async function POST(request: NextRequest) {
  try {
    const { projectPath } = await request.json();

    if (!projectPath) {
      return NextResponse.json(
        { error: '缺少项目路径' },
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

    const status = git.getStatus();
    const diff = git.getDiff(false);

    return NextResponse.json({ status, diff });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
