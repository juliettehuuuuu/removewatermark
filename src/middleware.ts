import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

export async function middleware(request: NextRequest) {
  console.log('🔗 Middleware执行:', request.nextUrl.pathname)
  
  const pathname = request.nextUrl.pathname
  
  // 🔐 安全检查：阻止直接访问敏感路径
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api/_') ||
      pathname.includes('..') ||
      pathname.includes('%')) {
    return new Response('Forbidden', { status: 403 })
  }

  // 🔐 安全检查：CSP headers
  const res = NextResponse.next()
  
  res.headers.set('Content-Security-Policy', 
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; " +
    "img-src 'self' data: blob: https:; " +
    "media-src 'self' data: blob: https:; " +
    "connect-src 'self' https: wss:; " +
    "worker-src 'self' blob:;"
  )
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // 🔐 Supabase认证检查
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            res.cookies.set(name, value, options)
          },
          remove(name: string, options: any) {
            res.cookies.set(name, '', { ...options, maxAge: 0 })
          }
        }
      }
    )

    // 检查用户会话
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('🔐 认证错误:', error.message)
    }

    // 需要认证的页面
    const protectedPaths = ['/tool']
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
    
    if (isProtectedPath && !user) {
      console.log('🔐 未认证用户访问受保护页面，重定向到登录')
      const loginUrl = new URL('/auth/signin', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    console.log('🔐 认证检查完成:', user ? `用户: ${user.email}` : '未登录用户')
  } catch (error) {
    console.error('🔐 认证中间件错误:', error)
  }
  
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 