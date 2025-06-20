import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { feedback } = await req.json()
    if (!feedback || typeof feedback !== 'string') {
      return NextResponse.json({ error: '反馈内容不能为空' }, { status: 400 })
    }

    // 配置SMTP（建议用环境变量存储）
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `AI工具反馈 <${process.env.SMTP_USER}>`,
      to: 'juliettehuuuuu@gmail.com',
      subject: 'AI工具用户反馈',
      text: feedback,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: '邮件发送失败' }, { status: 500 })
  }
} 