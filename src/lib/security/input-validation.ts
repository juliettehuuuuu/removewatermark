import { z } from 'zod'

// 🔐 输入验证和安全检查模块

// 基础验证模式
export const emailSchema = z.string().email('无效的邮箱格式').max(254, '邮箱地址过长')
export const passwordSchema = z.string().min(8, '密码至少8位').max(128, '密码过长')
export const nameSchema = z.string().min(1, '姓名不能为空').max(100, '姓名过长')

// 文件上传验证
export const fileSchema = z.object({
  size: z.number().max(5 * 1024 * 1024, '文件大小不能超过5MB'), // 5MB限制
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type),
    '只支持 JPG, PNG, WEBP, GIF 格式'
  ),
  name: z.string().max(255, '文件名过长')
})

// 图片处理请求验证
export const imageProcessingSchema = z.object({
  action: z.enum(['remove', 'enhance'], { errorMap: () => ({ message: '无效的操作类型' }) }),
  file: fileSchema
})

// 用户反馈验证
export const feedbackSchema = z.object({
  feedback: z.string()
    .min(1, '反馈内容不能为空')
    .max(1000, '反馈内容不能超过1000字符')
    .refine(
      (text) => !containsSuspiciousContent(text),
      '反馈内容包含不当内容'
    )
})

// 支付验证
export const paymentSchema = z.object({
  amount: z.number().positive('金额必须为正数').max(10000, '金额过大'),
  currency: z.enum(['USD', 'EUR', 'CNY'], { errorMap: () => ({ message: '不支持的货币类型' }) }),
  productId: z.string().min(1, '产品ID不能为空').max(100, '产品ID过长'),
  userId: z.string().uuid('无效的用户ID')
})

// 🔍 可疑内容检测
export function containsSuspiciousContent(text: string): boolean {
  const suspiciousPatterns = [
    // SQL注入模式
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
    /(\b(script|javascript|vbscript|expression)\b)/i,
    /(\b(onload|onerror|onclick|onmouseover)\b)/i,
    
    // XSS模式
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    
    // 命令注入模式
    /(\b(cmd|command|exec|system|shell)\b)/i,
    /[;&|`$(){}[\]]/g,
    
    // 路径遍历
    /\.\.\//g,
    /\.\.\\/g,
    
    // 特殊字符过多
    /[<>\"'&]{3,}/g
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(text))
}

// 🔍 输入清理
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[match] || match
    })
    .substring(0, 1000) // 限制长度
}

// 🔍 文件名安全验证
export function validateFileName(filename: string): boolean {
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i
  
  return !dangerousChars.test(filename) && 
         !reservedNames.test(filename) && 
         filename.length <= 255 &&
         !filename.includes('..')
}

// 🔍 URL安全验证
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const allowedProtocols = ['http:', 'https:']
    const allowedDomains = [
      'fluxkontext.space',
      'replicate.com',
      'api.replicate.com',
      'fal.ai',
      'supabase.co'
    ]
    
    return allowedProtocols.includes(urlObj.protocol) &&
           allowedDomains.some(domain => urlObj.hostname.endsWith(domain))
  } catch {
    return false
  }
}

// 🔍 图片数据验证
export function validateImageData(data: ArrayBuffer): boolean {
  const bytes = new Uint8Array(data)
  
  // 检查文件大小
  if (bytes.length === 0 || bytes.length > 5 * 1024 * 1024) {
    return false
  }
  
  // 检查文件头
  const headers = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46],
    gif: [0x47, 0x49, 0x46, 0x38]
  }
  
  const isValidHeader = Object.values(headers).some(header =>
    header.every((byte, index) => bytes[index] === byte)
  )
  
  return isValidHeader
}

// 🔍 速率限制检查
export class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>()
  
  checkLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const record = this.requests.get(key)
    
    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs })
      return true
    }
    
    if (record.count >= limit) {
      return false
    }
    
    record.count++
    return true
  }
  
  clear(): void {
    this.requests.clear()
  }
}

// 🔍 验证结果类型
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedData?: any
}

// 🔍 通用验证函数
export function validateInput<T>(
  data: any,
  schema: z.ZodSchema<T>
): ValidationResult {
  try {
    const result = schema.safeParse(data)
    
    if (result.success) {
      return {
        isValid: true,
        errors: [],
        sanitizedData: result.data
      }
    } else {
      return {
        isValid: false,
        errors: result.error.errors.map(err => err.message)
      }
    }
  } catch (error) {
    return {
      isValid: false,
      errors: ['验证过程中发生错误']
    }
  }
}

// 🔍 安全检查中间件
export function createSecurityMiddleware() {
  return {
    validateRequest: (req: Request) => {
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
      
      return { isValid: true }
    },
    
    validateFileUpload: (file: File) => {
      const validation = validateInput(file, fileSchema)
      if (!validation.isValid) {
        return { isValid: false, errors: validation.errors }
      }
      
      if (!validateFileName(file.name)) {
        return { isValid: false, errors: ['文件名包含危险字符'] }
      }
      
      return { isValid: true }
    }
  }
} 