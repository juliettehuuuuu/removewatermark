import { NextRequest, NextResponse } from 'next/server'

// 简单的内存速率限制器 (生产环境建议使用Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs
  
  const record = rateLimitMap.get(ip)
  
  if (!record || record.lastReset < windowStart) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

// 🔐 安全检查函数
function performSecurityChecks(request: NextRequest): { allowed: boolean; reason?: string } {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  
  // 检查可疑的User-Agent (但允许正常的curl和API请求)
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ]
  
  // 允许正常的工具和API请求
  const allowedTools = [
    /curl/i,
    /wget/i,
    /postman/i,
    /insomnia/i
  ]
  
  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent)) && 
      !allowedTools.some(pattern => pattern.test(userAgent))) {
    return { allowed: false, reason: 'Suspicious User-Agent' }
  }
  
  // 检查路径遍历攻击
  if (url.pathname.includes('..') || url.pathname.includes('\\')) {
    return { allowed: false, reason: 'Path traversal attempt' }
  }
  
  // 检查SQL注入模式
  const sqlInjectionPatterns = [
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
    /update.*set/i
  ]
  
  if (sqlInjectionPatterns.some(pattern => 
    pattern.test(url.pathname) || pattern.test(url.search)
  )) {
    return { allowed: false, reason: 'SQL injection attempt' }
  }
  
  // 检查XSS攻击
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i
  ]
  
  if (xssPatterns.some(pattern => 
    pattern.test(url.pathname) || pattern.test(url.search)
  )) {
    return { allowed: false, reason: 'XSS attempt' }
  }
  
  return { allowed: true }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔐 安全检查
  const securityCheck = performSecurityChecks(request)
  if (!securityCheck.allowed) {
    console.log(`🔒 Security block: ${securityCheck.reason} from ${request.headers.get('x-forwarded-for') || 'unknown'}`)
    return NextResponse.json(
      { error: 'Request blocked for security reasons' },
      { status: 403 }
    )
  }
  
  // 强制HTTPS重定向 (生产环境)
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto')
    if (proto === 'http') {
      return NextResponse.redirect(`https://fluxkontext.space${pathname}`, 301)
    }
  }
  
  // API v1 路由重写 - 将文档中的API端点映射到实际实现
  if (pathname.startsWith('/api/v1/')) {
    let newPath = '/api/flux-kontext'
    let action = ''
    
    // 根据URL路径确定action类型
    if (pathname.includes('/text-to-image/pro')) {
      action = 'text-to-image-pro'
    } else if (pathname.includes('/text-to-image/max')) {
      action = 'edit-image-max'
    } else if (pathname.includes('/image-edit/pro')) {
      action = 'edit-image-pro'
    } else if (pathname.includes('/image-edit/max')) {
      action = 'edit-image-max'
    }
    
    // 创建新的URL并添加action参数
    const url = request.nextUrl.clone()
    url.pathname = newPath
    
    // 如果确定了action，添加到查询参数中
    if (action) {
      url.searchParams.set('action', action)
    }
    
    return NextResponse.rewrite(url)
  }
  
  const response = NextResponse.next()
  
  // 添加安全头
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )
  
  // 🔐 增强的内容安全策略
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
    "https://platform.twitter.com " +
    "https://www.googletagmanager.com " +
    "https://accounts.google.com " +
    "https://apis.google.com " +
    "https://www.gstatic.com " +
    "https://gstatic.com " +
    "https://challenges.cloudflare.com " +
    "https://static.cloudflareinsights.com " +
    "data: blob:; " +
    "style-src 'self' 'unsafe-inline' " +
    "https://fonts.googleapis.com " +
    "https://accounts.google.com " +
    "https://www.gstatic.com; " +
    "font-src 'self' " +
    "https://fonts.gstatic.com " +
    "https://accounts.google.com " +
    "data:; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https: " +
    "https://accounts.google.com " +
    "https://www.googleapis.com " +
    "https://challenges.cloudflare.com " +
    "wss: ws:; " +
    "frame-src 'self' " +
    "https://accounts.google.com " +
    "https://www.google.com " +
    "https://challenges.cloudflare.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self' https:; " +
    "frame-ancestors 'self'; " +
    "upgrade-insecure-requests;"
  )
  
  // 🔐 添加更多安全头
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  
  // API路由速率限制 (仅在生产环境启用)
  if (process.env.NODE_ENV === 'production' && request.nextUrl.pathname.startsWith('/api/')) {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') ?? 
               '127.0.0.1'
    
    // 不同API端点不同的限制
    let limit = 10
    let windowMs = 60000 // 1分钟
    
    if (request.nextUrl.pathname.includes('/auth/')) {
      limit = 20 // 生产环境认证放宽
      windowMs = 300000 // 5分钟
    } else if (request.nextUrl.pathname.includes('/payment/')) {
      limit = 10 // 生产环境支付放宽
      windowMs = 600000 // 10分钟
    } else if (request.nextUrl.pathname.includes('/remove-watermark') || 
               request.nextUrl.pathname.includes('/enhance-image')) {
      limit = 5 // 图片处理API限制更严格
      windowMs = 60000 // 1分钟
    }
    
    if (!rateLimit(ip, limit, windowMs)) {
      console.log(`🔒 Rate limit exceeded for IP: ${ip} on ${request.nextUrl.pathname}`)
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
  }
  
  // 🔐 记录可疑请求
  const suspiciousPatterns = [
    /\.\.\//, // 路径遍历
    /<script/i, // XSS
    /union.*select/i, // SQL注入
    /javascript:/i, // JavaScript协议
    /on\w+\s*=/i // 事件处理器
  ]
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(pathname) || pattern.test(request.nextUrl.search)
  )
  
  if (isSuspicious) {
    console.log(`🔒 Suspicious request detected: ${pathname} from ${request.headers.get('x-forwarded-for') || 'unknown'}`)
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 