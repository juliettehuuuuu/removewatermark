'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import type { User } from '@supabase/supabase-js'

// 定义认证上下文类型
interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User | null }>
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; user?: User | null }>
  signOut: () => Promise<{ success: boolean; error?: string }>
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | null>(null)

// 认证Provider组件
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

// 自定义钩子来使用认证上下文
export function useAuthContext() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}

// 为了保持向后兼容，也导出一个useSession钩子
export function useSession() {
  const { user, loading } = useAuthContext()
  
  return {
    data: user ? { user } : null,
    status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated'
  }
} 