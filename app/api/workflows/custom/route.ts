import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const customWorkflowsPath = path.join(process.cwd(), 'data', 'custom-workflows.json');
    
    if (!fs.existsSync(customWorkflowsPath)) {
      return NextResponse.json({ workflows: [] });
    }
    
    const data = fs.readFileSync(customWorkflowsPath, 'utf-8');
    const workflows = JSON.parse(data);
    
    return NextResponse.json({ workflows });
  } catch (error: any) {
    console.error('[Custom Workflows API] 读取失败:', error);
    return NextResponse.json({ workflows: [] });
  }
}

export async function POST(request: Request) {
  try {
    const workflow = await request.json();
    
    const dataDir = path.join(process.cwd(), 'data');
    const customWorkflowsPath = path.join(dataDir, 'custom-workflows.json');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    let workflows = [];
    if (fs.existsSync(customWorkflowsPath)) {
      const data = fs.readFileSync(customWorkflowsPath, 'utf-8');
      workflows = JSON.parse(data);
    }
    
    const existingIndex = workflows.findIndex((w: any) => w.id === workflow.id);
    if (existingIndex >= 0) {
      workflows[existingIndex] = workflow;
    } else {
      workflows.push(workflow);
    }
    
    fs.writeFileSync(customWorkflowsPath, JSON.stringify(workflows, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Custom Workflows API] 保存失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    const customWorkflowsPath = path.join(process.cwd(), 'data', 'custom-workflows.json');
    
    if (!fs.existsSync(customWorkflowsPath)) {
      return NextResponse.json({ success: true });
    }
    
    const data = fs.readFileSync(customWorkflowsPath, 'utf-8');
    let workflows = JSON.parse(data);
    
    workflows = workflows.filter((w: any) => w.id !== id);
    
    fs.writeFileSync(customWorkflowsPath, JSON.stringify(workflows, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Custom Workflows API] 删除失败:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
