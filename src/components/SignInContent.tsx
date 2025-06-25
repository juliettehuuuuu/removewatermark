"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthContext } from "@/components/providers/AuthProvider"

export function SignInContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, loading } = useAuthContext()

  // 检查URL中的错误参数
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError("Login failed. Please try again.")
    }
  }, [searchParams])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      console.log('🔍 开始登录流程...')
      
      const result = await signIn(email, password)

      if (!result.success) {
        console.error('❌ 登录失败:', result.error)
        setError(result.error || "Invalid email or password.")
        return
      }

      console.log('✅ 登录成功，准备跳转...')
      
      // 登录成功后跳转
      const callbackUrl = searchParams.get('callbackUrl') || '/tool'
      console.log('🔄 跳转到:', callbackUrl)
      router.push(callbackUrl)
      
    } catch (error: any) {
      console.error('❌ 登录流程异常:', error)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Sign in to your account
          </h2>
          
          <p className="mt-2 text-center text-sm text-slate-600">
            Or{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <form className="mt-8 space-y-6" onSubmit={handleEmailSignIn}>
            {error && (
              <div className="rounded-md bg-red-100 p-4 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 显示处理状态 */}
            {loading && (
              <div className="rounded-md bg-blue-100 p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm text-blue-700">
                      Signing you in...
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* 快捷键提示 */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Press <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded-lg">Ctrl + Enter</kbd> to sign in quickly
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 