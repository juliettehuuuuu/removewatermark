'use client'

import { useAuthContext } from '@/components/providers/AuthProvider'
import { useEffect } from 'react'

export function AuthDebug() {
  const { user, loading, isAuthenticated } = useAuthContext()

  useEffect(() => {
    console.log('🔍 AuthDebug - 认证状态变化:', {
      user: !!user,
      userEmail: user?.email,
      loading,
      isAuthenticated,
      timestamp: new Date().toISOString()
    })
  }, [user, loading, isAuthenticated])

  // 在开发环境显示调试信息
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono z-50">
      <div>Auth Status: {loading ? 'Loading...' : isAuthenticated ? '✅ Logged In' : '❌ Not Logged In'}</div>
      {user && <div>User: {user.user_metadata?.name || user.email}</div>}
      <div>Timestamp: {new Date().toLocaleTimeString()}</div>
    </div>
  )
} 