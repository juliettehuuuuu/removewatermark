import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }
  
  console.log('🔍 开始注册用户:', email)
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || email },
        emailRedirectTo: `${process.env.NEXTAUTH_URL}/auth/callback`
      }
    })
    
    if (error) {
      console.error('❌ 注册失败:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    console.log('✅ 用户注册成功:', data.user?.id)
    
    // 手动确认邮箱（开发环境）
    if (data.user && !data.user.email_confirmed_at) {
      console.log('🔧 开发环境：手动确认邮箱')
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        data.user.id,
        { email_confirm: true }
      )
      
      if (confirmError) {
        console.error('❌ 邮箱确认失败:', confirmError.message)
      } else {
        console.log('✅ 邮箱确认成功')
      }
    }
    
    return NextResponse.json({ user: data.user })
  } catch (e: any) {
    console.error('❌ 注册异常:', e.message)
    return NextResponse.json({ error: e.message || 'Registration failed.' }, { status: 500 })
  }
} 