import { NextRequest, NextResponse } from 'next/server'
import { callReplicateAPI } from '@/lib/replicate'

// 微调API路由，POST方法，接收图片并返回处理后图片URL
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
  }
  const resultUrl = await callReplicateAPI('tune', file)
  return NextResponse.json({ resultUrl })
} 