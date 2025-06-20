import { NextRequest, NextResponse } from 'next/server'

// 目前未实现tune功能，直接返回未实现
export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Tune功能暂未开放' }, { status: 501 })
} 