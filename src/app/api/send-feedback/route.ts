import { NextRequest, NextResponse } from 'next/server'

// 快速响应的反馈API - 优化邮件发送性能
export async function POST(req: NextRequest) {
  try {
    console.log('📝 收到反馈提交请求')
    
    const { feedback, user } = await req.json()

    // 基础验证
    if (!feedback || typeof feedback !== 'string') {
      return NextResponse.json({ error: 'Feedback content cannot be empty' }, { status: 400 })
    }

    if (feedback.length > 1000) {
      return NextResponse.json({ error: 'Feedback content cannot exceed 1000 characters' }, { status: 400 })
    }

    // 输入清理
    const sanitizedFeedback = feedback.trim().substring(0, 1000)
    const sanitizedUserName = user?.name ? user.name.trim() : 'Anonymous'
    const sanitizedUserEmail = user?.email ? user.email.trim() : 'N/A'

    // 记录反馈到控制台
    console.log('📝 反馈提交:')
    console.log('====================================')
    console.log('用户:', sanitizedUserName)
    console.log('邮箱:', sanitizedUserEmail) 
    console.log('用户ID:', user?.id || 'N/A')
    console.log('时间:', new Date().toLocaleString())
    console.log('反馈内容:', sanitizedFeedback)
    console.log('====================================')

    // 先返回成功响应，避免前端等待
    const response = NextResponse.json({ 
      message: 'Feedback submitted successfully!',
      timestamp: new Date().toISOString()
    })

    // 异步发送邮件，不阻塞响应
    const emailUser = process.env.EMAIL_SERVER_USER
    const emailPass = process.env.EMAIL_SERVER_PASSWORD  
    const emailReceiver = process.env.GMAIL_RECEIVER || emailUser

    if (emailUser && emailPass) {
      // 使用setImmediate在下一个事件循环中异步发送邮件
      setImmediate(async () => {
        try {
          console.log('📧 开始异步发送邮件...')
          
          const nodemailer = await import('nodemailer')
          
          // 配置邮件传输器，增加超时设置
          const transporter = nodemailer.default.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: emailUser,
              pass: emailPass,
            },
            connectionTimeout: 5000,  // 5秒连接超时
            greetingTimeout: 3000,    // 3秒握手超时
            socketTimeout: 5000,      // 5秒socket超时
            tls: {
              rejectUnauthorized: false
            }
          })

          // 设置总体超时控制
          const emailPromise = transporter.sendMail({
            from: emailUser,
            to: emailReceiver,
            subject: '🚀 User Feedback - AI Image Tool',
            html: `
              <h2>New User Feedback</h2>
              <p><strong>From:</strong> ${sanitizedUserName}</p>
              <p><strong>Email:</strong> ${sanitizedUserEmail}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              <h3>Feedback:</h3>
              <p>${sanitizedFeedback}</p>
            `,
          })

          // 10秒总体超时
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('邮件发送超时')), 10000)
          })

          await Promise.race([emailPromise, timeoutPromise])
          console.log('✅ 邮件发送成功')
          
        } catch (emailError) {
          console.error('❌ 邮件发送失败:', emailError)
          // 邮件失败不影响反馈记录，只记录日志
        }
      })
    } else {
      console.log('ℹ️ 邮件服务未配置，反馈已记录到控制台')
    }

    return response

  } catch (error) {
    console.error('❌ 反馈提交失败:', error)
    return NextResponse.json({ 
      error: 'Failed to submit feedback. Please try again later.'
    }, { status: 500 })
  }
} 