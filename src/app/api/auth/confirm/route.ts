import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  console.log('🔍 邮件确认回调:', { code: !!code, error, error_description })

  if (error) {
    console.error('❌ 邮件确认失败:', error, error_description)
    return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin))
  }

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // 这里会在响应中设置cookie
          },
          remove(name: string, options: any) {
            // 这里会在响应中删除cookie
          }
        }
      }
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ 邮件确认代码交换失败:', error)
        return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
      }

      console.log('✅ 邮件确认成功，重定向到工具页面')
      
      // 成功确认后重定向到工具页面，并添加成功提示
      const redirectUrl = new URL('/tool', requestUrl.origin)
      redirectUrl.searchParams.set('confirmed', 'true')
      
      const response = NextResponse.redirect(redirectUrl)
      
      // 设置认证相关的cookie
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // 这里可以设置一些额外的cookie或处理逻辑
      }
      
      return response
      
    } catch (error: any) {
      console.error('❌ 邮件确认处理异常:', error)
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }
  }

  // 如果没有code也没有error，重定向到登录页
  console.log('⚠️ 邮件确认回调缺少必要参数')
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
} 