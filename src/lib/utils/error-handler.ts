import { getClientIp } from './ip'

// 🔐 统一错误处理和安全日志模块

// 生成请求ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取用户代理
function getUserAgent(req?: Request): string {
  if (req) {
    return req.headers.get('user-agent') || 'unknown'
  }
  return 'unknown'
}

// 从请求中获取客户端IP
async function getClientIpFromRequest(req?: Request): Promise<string> {
  if (!req) return 'unknown'
  
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

// 创建统一错误响应
export function createErrorResponse(
  error: Error | string, 
  status: number = 500,
  req?: Request
): Response {
  const isDev = process.env.NODE_ENV === 'development'
  const errorMessage = typeof error === 'string' ? error : error.message
  
  // 记录安全事件
  logSecurityEvent('error_response', {
    status,
    error: isDev ? errorMessage : 'Internal server error',
    ip: 'unknown', // 将在异步函数中处理
    userAgent: getUserAgent(req),
    timestamp: new Date().toISOString()
  })
  
  return Response.json({
    error: isDev ? errorMessage : 'Internal server error',
    status,
    timestamp: new Date().toISOString(),
    requestId: generateRequestId()
  }, { status })
}

// 记录安全事件
export function logSecurityEvent(event: string, details: any): void {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ...details
  }
  
  // 开发环境输出到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔒 Security Event: ${event}`, logData)
  } else {
    // 生产环境可以发送到日志服务
    console.log(`🔒 Security Event: ${event}`, {
      timestamp: logData.timestamp,
      event: logData.event,
      ip: logData.ip || 'unknown'
    })
  }
}

// 验证错误
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// 认证错误
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

// 权限错误
export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

// 速率限制错误
export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

// 文件上传错误
export class FileUploadError extends Error {
  constructor(message: string, public file?: string) {
    super(message)
    this.name = 'FileUploadError'
  }
}

// 安全检查中间件
export function createSecurityMiddleware() {
  return {
    // 验证请求头
    validateHeaders: (req: Request): { isValid: boolean; error?: string } => {
      const headers = req.headers
      
      // 检查Content-Type
      const contentType = headers.get('content-type')
      if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
        return { isValid: false, error: '不支持的Content-Type' }
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
    },
    
    // 记录请求
    logRequest: async (req: Request, response?: Response): Promise<void> => {
      const url = new URL(req.url)
      const method = req.method
      const ip = await getClientIpFromRequest(req)
      const userAgent = getUserAgent(req)
      
      // 记录可疑请求
      const suspiciousPatterns = [
        /\.\.\//, // 路径遍历
        /<script/i, // XSS
        /union.*select/i, // SQL注入
        /javascript:/i, // JavaScript协议
        /on\w+\s*=/i // 事件处理器
      ]
      
      const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(url.pathname) || pattern.test(url.search) || pattern.test(userAgent)
      )
      
      if (isSuspicious) {
        logSecurityEvent('suspicious_request', {
          method,
          path: url.pathname,
          query: url.search,
          ip,
          userAgent,
          status: response?.status || 'unknown'
        })
      }
    }
  }
}

// 错误处理装饰器
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      // 记录错误
      logSecurityEvent('unhandled_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // 重新抛出错误
      throw error
    }
  }
}

// 安全响应包装器
export function secureResponse(response: Response, req?: Request): Response {
  // 添加安全头
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
} 