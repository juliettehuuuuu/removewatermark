import { NextRequest, NextResponse } from 'next/server'
import { callReplicateAPI } from '@/lib/replicate'
import { createServerClient } from '@supabase/ssr'
import { validateInput, fileSchema, validateImageData, validateFileName } from '@/lib/security/input-validation'
import { createErrorResponse, logSecurityEvent, FileUploadError } from '@/lib/utils/error-handler'

// 内存中简单存储用户每日调用次数（生产环境建议用数据库）
const userUsageMap = new Map<string, { date: string, count: number }>()
const DAILY_LIMIT = 10

// 从请求中获取客户端IP的辅助函数
async function getClientIpFromRequest(req: Request): Promise<string> {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const cfConnectingIp = req.headers.get('cf-connecting-ip')
    const xClientIp = req.headers.get('x-client-ip')
    
    if (cfConnectingIp) return cfConnectingIp
    if (realIp) return realIp
    if (forwardedFor) return forwardedFor.split(',')[0].trim()
    if (xClientIp) return xClientIp
    
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

// 安全检查中间件
function createSecurityMiddleware() {
  return {
    validateHeaders: (req: Request): { isValid: boolean; error?: string } => {
      const headers = req.headers
      
      // 检查Content-Type
      const contentType = headers.get('content-type')
      if (contentType && !contentType.includes('multipart/form-data')) {
        return { isValid: false, error: '只支持multipart/form-data格式' }
      }
      
      // 检查User-Agent
      const userAgent = headers.get('user-agent')
      if (!userAgent || userAgent.length > 500) {
        return { isValid: false, error: '无效的User-Agent' }
      }
      
      // 检查请求大小
      const contentLength = headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
        return { isValid: false, error: '请求体过大' }
      }
      
      return { isValid: true }
    }
  }
}

// 获取Supabase会话的辅助函数
async function getSupabaseSession(req: NextRequest) {
  const res = new Response()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // 在API路由中，我们不需要设置cookie
        },
        remove(name: string, options: any) {
          // 在API路由中，我们不需要删除cookie
        },
      },
    }
  )
  
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// 高清化API路由，POST方法，接收图片并返回处理后图片URL
export async function POST(req: NextRequest) {
  try {
    // 🔐 安全检查：验证请求头
    const securityMiddleware = createSecurityMiddleware()
    const headerValidation = securityMiddleware.validateHeaders(req)
    if (!headerValidation.isValid) {
      logSecurityEvent('invalid_headers', {
        error: headerValidation.error,
        ip: await getClientIpFromRequest(req),
        path: '/api/enhance-image'
      })
      return createErrorResponse(headerValidation.error!, 400, req)
    }

    // 登录校验 - 使用Supabase
    const { session, error: authError } = await getSupabaseSession(req)
    
    if (authError || !session || !session.user?.email) {
      logSecurityEvent('unauthorized_access', {
        path: '/api/enhance-image',
        ip: await getClientIpFromRequest(req),
        error: authError?.message
      })
      return createErrorResponse('Not authenticated', 401, req)
    }
    
    const userId = session.user.email
    
    // 🔐 安全检查：记录用户活动
    logSecurityEvent('api_access', {
      userId,
      endpoint: '/api/enhance-image',
      ip: await getClientIpFromRequest(req)
    })

    // 使用限制检查
    const today = new Date().toISOString().slice(0, 10)
    const usage = userUsageMap.get(userId)
    if (!usage || usage.date !== today) {
      userUsageMap.set(userId, { date: today, count: 1 })
    } else if (usage.count >= DAILY_LIMIT) {
      logSecurityEvent('rate_limit_exceeded', {
        userId,
        endpoint: '/api/enhance-image',
        currentCount: usage.count,
        limit: DAILY_LIMIT
      })
      return createErrorResponse('Daily free limit reached', 429, req)
    } else {
      usage.count++
      userUsageMap.set(userId, usage)
    }

    // 解析FormData获取图片
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    
    if (!file) {
      return createErrorResponse('No image uploaded', 400, req)
    }

    // 🔐 安全检查：文件验证
    try {
      // 1. 验证文件名
      if (!validateFileName(file.name)) {
        logSecurityEvent('suspicious_filename', {
          userId,
          filename: file.name,
          ip: await getClientIpFromRequest(req)
        })
        throw new FileUploadError('文件名包含危险字符', file.name)
      }

      // 2. 验证文件类型和大小
      const fileValidation = validateInput(file, fileSchema)
      if (!fileValidation.isValid) {
        logSecurityEvent('invalid_file_upload', {
          userId,
          filename: file.name,
          errors: fileValidation.errors,
          ip: await getClientIpFromRequest(req)
        })
        throw new FileUploadError(`文件验证失败: ${fileValidation.errors.join(', ')}`, file.name)
      }

      // 3. 验证文件内容
      const buffer = await file.arrayBuffer()
      if (!validateImageData(buffer)) {
        logSecurityEvent('invalid_image_content', {
          userId,
          filename: file.name,
          size: buffer.byteLength,
          ip: await getClientIpFromRequest(req)
        })
        throw new FileUploadError('无效的图片文件内容', file.name)
      }

    } catch (error) {
      if (error instanceof FileUploadError) {
        return createErrorResponse(error.message, 400, req)
      }
      throw error
    }

    // 调用AI处理
    const resultUrl = await callReplicateAPI('enhance', file)
    
    // 🔐 安全检查：记录成功处理
    logSecurityEvent('image_processed_successfully', {
      userId,
      filename: file.name,
      fileSize: file.size,
      resultUrl: resultUrl.substring(0, 50) + '...' // 只记录URL前缀
    })

    return NextResponse.json({ 
      resultUrl, 
      remaining: DAILY_LIMIT - userUsageMap.get(userId)!.count 
    })

  } catch (error) {
    // 🔐 安全检查：记录错误
    logSecurityEvent('api_error', {
      endpoint: '/api/enhance-image',
      error: error instanceof Error ? error.message : String(error),
      ip: await getClientIpFromRequest(req)
    })

    if (error instanceof FileUploadError) {
      return createErrorResponse(error.message, 400, req)
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
      req
    )
  }
} 