import { NextRequest, NextResponse } from 'next/server';
import { ProjectScanner } from '@/lib/context/project-scanner';

export async function POST(request: NextRequest) {
  try {
    const { projectPath } = await request.json();

    if (!projectPath) {
      return NextResponse.json(
        { error: '缺少项目路径' },
        { status: 400 }
      );
    }

    const scanner = new ProjectScanner(projectPath);
    const context = await scanner.scan();

    return NextResponse.json({ context });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
