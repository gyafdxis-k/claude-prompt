import { NextResponse } from 'next/server';
import { PromptScanner } from '@/lib/prompts/prompt-scanner';

let cachedPrompts: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60000;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedPrompts && (now - cacheTime) < CACHE_DURATION) {
      console.log('[API /prompts/scan] 使用缓存');
      return NextResponse.json(cachedPrompts);
    }

    console.log('[API /prompts/scan] 开始扫描...');
    const scanner = new PromptScanner();
    const prompts = scanner.scanAllPrompts();

    const result = { prompts, count: prompts.length };
    cachedPrompts = result;
    cacheTime = now;

    console.log(`[API /prompts/scan] 扫描完成，找到 ${prompts.length} 个模板`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /prompts/scan] 错误:', error);
    return NextResponse.json(
      { error: error.message || '扫描失败', prompts: [] },
      { status: 500 }
    );
  }
}
