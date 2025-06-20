"use client"

import { useState, useEffect } from "react"
import { signIn, getProviders } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
// 导入认证文案模块
import { auth, common } from "@/lib/content"

export function SignInContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [providers, setProviders] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // 获取可用的认证提供商
  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  // 检查URL中的错误参数 - 使用auth模块的错误文案
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const errorMessage = errorParam === 'CredentialsSignin' 
        ? "Invalid email or password."
        : "OAuth login error, please try again."
      setError(errorMessage)
    }
  }, [searchParams])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password.")
    } else {
      const callbackUrl = searchParams.get('callbackUrl') || '/tool'
      router.push(callbackUrl)
    }
    setIsLoading(false)
  }

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    setError("")
    const callbackUrl = searchParams.get('callbackUrl') || '/tool'
    await signIn(provider, { 
      callbackUrl,
      redirect: true 
    })
    setIsLoading(false)
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
          {/* OAuth 登录按钮 */}
          {/* Google 登录按钮已移除，仅保留邮箱登录 */}

          {/* 分隔线 - 只有在有OAuth提供商时才显示 */}
          {providers && ((providers.google && process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true") || (providers.github && process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true")) && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-50 text-slate-500">Or continue with</span>
              </div>
            </div>
          )}

          {/* 邮箱密码登录表单 */}
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
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign in"}
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