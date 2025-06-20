import { NextRequest, NextResponse } from 'next/server'
import { callReplicateAPI } from '@/lib/replicate'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 内存中简单存储用户每日调用次数（生产环境建议用数据库）
const userUsageMap = new Map<string, { date: string, count: number }>()
const DAILY_LIMIT = 10

// 去水印API路由，POST方法，接收图片并返回处理后图片URL
export async function POST(req: NextRequest) {
  // 登录校验
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const userId = session.user.email
  const today = new Date().toISOString().slice(0, 10)
  const usage = userUsageMap.get(userId)
  if (!usage || usage.date !== today) {
    userUsageMap.set(userId, { date: today, count: 1 })
  } else if (usage.count >= DAILY_LIMIT) {
    return NextResponse.json({ error: 'Daily free limit reached' }, { status: 429 })
  } else {
    usage.count++
    userUsageMap.set(userId, usage)
  }
  // 解析FormData获取图片
  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
  }
  // 调用AI处理
  const resultUrl = await callReplicateAPI('remove', file)
  return NextResponse.json({ resultUrl, remaining: DAILY_LIMIT - userUsageMap.get(userId)!.count })
} 