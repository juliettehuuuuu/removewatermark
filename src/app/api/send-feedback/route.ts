import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { validateInput, feedbackSchema, sanitizeInput } from '@/lib/security/input-validation'
import { createErrorResponse, logSecurityEvent, ValidationError } from '@/lib/utils/error-handler'

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
      if (contentType && !contentType.includes('application/json')) {
        return { isValid: false, error: '只支持application/json格式' }
      }
      
      // 检查User-Agent
      const userAgent = headers.get('user-agent')
      if (!userAgent || userAgent.length > 500) {
        return { isValid: false, error: '无效的User-Agent' }
      }
      
      // 检查请求大小
      const contentLength = headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB
        return { isValid: false, error: '请求体过大' }
      }
      
      return { isValid: true }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // 🔐 安全检查：验证请求头
    const securityMiddleware = createSecurityMiddleware()
    const headerValidation = securityMiddleware.validateHeaders(req)
    if (!headerValidation.isValid) {
      logSecurityEvent('invalid_headers', {
        error: headerValidation.error,
        ip: await getClientIpFromRequest(req),
        path: '/api/send-feedback'
      })
      return createErrorResponse(headerValidation.error!, 400, req)
    }

    // 从环境变量中获取邮箱配置，增强安全性
    const { GMAIL_USER, GMAIL_PASS, GMAIL_RECEIVER } = process.env

    // 校验环境变量
    if (!GMAIL_USER || !GMAIL_PASS || !GMAIL_RECEIVER) {
      logSecurityEvent('configuration_error', {
        error: 'Email credentials are not set in environment variables',
        ip: await getClientIpFromRequest(req)
      })
      return createErrorResponse('Server configuration error.', 500, req)
    }

    // 解析请求体
    let requestBody
    try {
      requestBody = await req.json()
    } catch (error) {
      logSecurityEvent('invalid_json', {
        error: 'Invalid JSON in request body',
        ip: await getClientIpFromRequest(req)
      })
      return createErrorResponse('Invalid JSON format.', 400, req)
    }

    const { feedback, user } = requestBody

    // 🔐 安全检查：输入验证
    const feedbackValidation = validateInput({ feedback }, feedbackSchema)
    if (!feedbackValidation.isValid) {
      logSecurityEvent('invalid_feedback', {
        errors: feedbackValidation.errors,
        ip: await getClientIpFromRequest(req),
        user: user?.email || 'anonymous'
      })
      return createErrorResponse(`反馈验证失败: ${feedbackValidation.errors.join(', ')}`, 400, req)
    }

    // 🔐 安全检查：输入清理
    const sanitizedFeedback = sanitizeInput(feedback)
    const sanitizedUserName = user?.name ? sanitizeInput(user.name) : 'Anonymous'
    const sanitizedUserEmail = user?.email ? sanitizeInput(user.email) : 'N/A'

    // 🔐 安全检查：记录反馈提交
    logSecurityEvent('feedback_submitted', {
      userEmail: sanitizedUserEmail,
      feedbackLength: sanitizedFeedback.length,
      ip: await getClientIpFromRequest(req)
    })

    // 创建Nodemailer transporter，使用Gmail服务
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS, // 推荐使用Gmail应用密码
      },
    })

    // 构建邮件内容
    const mailOptions = {
      from: `"AI Tool Feedback" <${GMAIL_USER}>`,
      to: GMAIL_RECEIVER,
      subject: '🚀 New Feedback Received for AI Tool',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #0d6efd;">新的用户反馈！</h2>
          <p><strong>来自用户:</strong> ${sanitizedUserName}</p>
          <p><strong>用户邮箱:</strong> ${sanitizedUserEmail}</p>
          <p><strong>用户ID:</strong> ${user?.id || 'N/A'}</p>
          <p><strong>提交时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <h3>反馈内容:</h3>
          <p style="background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 15px; border-radius: 4px;">
            ${sanitizedFeedback}
          </p>
          <p style="font-size: 0.9em; color: #777;">
            该邮件由AI去水印工具的反馈系统自动发送。
          </p>
        </div>
      `,
    }

    // 发送邮件
    await transporter.sendMail(mailOptions)

    // 🔐 安全检查：记录成功发送
    logSecurityEvent('feedback_sent_successfully', {
      userEmail: sanitizedUserEmail,
      ip: await getClientIpFromRequest(req)
    })

    return NextResponse.json({ message: 'Feedback submitted successfully!' })

  } catch (error) {
    // 🔐 安全检查：记录错误
    logSecurityEvent('feedback_error', {
      error: error instanceof Error ? error.message : String(error),
      ip: await getClientIpFromRequest(req)
    })

    console.error('Failed to send feedback email:', error)
    return createErrorResponse('Failed to submit feedback.', 500, req)
  }
} 