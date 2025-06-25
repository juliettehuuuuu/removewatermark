'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前会话
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('获取session失败:', error)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 认证状态变化:', event, session?.user?.email)
        
        // 处理不同的认证事件
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ 用户已登录')
            break
          case 'SIGNED_OUT':
            console.log('👋 用户已登出')
            break
          case 'TOKEN_REFRESHED':
            console.log('🔄 令牌已刷新')
            break
          case 'USER_UPDATED':
            console.log('👤 用户信息已更新')
            break
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
        
        // 如果是邮件确认成功，刷新页面以同步状态
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('📧 邮件确认完成，同步认证状态')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 登录函数
  const signIn = async (email: string, password: string) => {
    console.log('🔍 开始登录:', email)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ 登录失败:', error.message)
        setLoading(false)
        return { success: false, error: error.message }
      }

      console.log('✅ 登录成功:', data.user?.email)
      setLoading(false)
      return { success: true, user: data.user }
    } catch (error: any) {
      console.error('❌ 登录异常:', error)
      setLoading(false)
      return { success: false, error: error.message || '登录失败' }
    }
  }

  // 注册函数
  const signUp = async (email: string, password: string, name?: string) => {
    console.log('🔍 开始注册:', email)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name: name || email.split('@')[0] 
          },
          // 设置邮件确认重定向URL
          emailRedirectTo: `${window.location.origin}/api/auth/confirm`
        }
      })

      if (error) {
        console.error('❌ 注册失败:', error.message)
        setLoading(false)
        return { success: false, error: error.message }
      }

      console.log('✅ 注册成功:', data.user?.email)
      
      // 开发环境自动确认邮箱
      if (process.env.NODE_ENV === 'development' && data.user && !data.user.email_confirmed_at) {
        console.log('🔧 开发环境：自动确认邮箱...')
        // 这里可以调用管理员API确认邮箱，或者提示用户检查邮件
      }
      
      setLoading(false)
      return { success: true, user: data.user }
    } catch (error: any) {
      console.error('❌ 注册异常:', error)
      setLoading(false)
      return { success: false, error: error.message || '注册失败' }
    }
  }

  // 登出函数
  const signOut = async () => {
    console.log('🔍 开始登出')
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ 登出失败:', error.message)
        setLoading(false)
        return { success: false, error: error.message }
      }

      console.log('✅ 登出成功')
      setUser(null)
      setLoading(false)
      return { success: true }
    } catch (error: any) {
      console.error('❌ 登出异常:', error)
      setLoading(false)
      return { success: false, error: error.message || '登出失败' }
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  }
} 