import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  // 从环境变量中获取邮箱配置，增强安全性
  const { GMAIL_USER, GMAIL_PASS, GMAIL_RECEIVER } = process.env

  // 校验环境变量
  if (!GMAIL_USER || !GMAIL_PASS || !GMAIL_RECEIVER) {
    console.error('Email credentials are not set in environment variables.')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  try {
    const { feedback, user } = await req.json()

    // 校验请求体
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback content is required.' }, { status: 400 })
    }

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
          <p><strong>来自用户:</strong> ${user?.name || user?.email || 'Anonymous'}</p>
          <p><strong>用户ID:</strong> ${user?.id || 'N/A'}</p>
          <hr style="border: 0; border-top: 1px solid #eee;">
          <h3>反馈内容:</h3>
          <p style="background-color: #f8f9fa; border-left: 4px solid #0d6efd; padding: 15px; border-radius: 4px;">
            ${feedback}
          </p>
          <p style="font-size: 0.9em; color: #777;">
            该邮件由AI去水印工具的反馈系统自动发送。
          </p>
        </div>
      `,
    }

    // 发送邮件
    await transporter.sendMail(mailOptions)

    return NextResponse.json({ message: 'Feedback submitted successfully!' })
  } catch (error) {
    console.error('Failed to send feedback email:', error)
    return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 500 })
  }
} 