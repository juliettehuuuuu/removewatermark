"use client"
import React, { useState, useRef, useEffect, Suspense } from 'react'
import { ImageUploader } from '@/components/ImageUploader'
import { ResultPreview } from '@/components/ResultPreview'
import { ToolButtons } from '@/components/ToolButtons'
import { DownloadButton } from '@/components/DownloadButton'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Image as ImageIcon, Upload, LogOut, CheckCircle } from 'lucide-react'
import { AuthDebug } from '@/components/AuthDebug'

// 内部组件来处理搜索参数
function ToolPageContent() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, loading, signOut } = useAuthContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showConfirmSuccess, setShowConfirmSuccess] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const feedbackRef = useRef<HTMLTextAreaElement>(null)

  // 添加调试信息
  console.log('🔍 Tool页面状态:', { 
    user: !!user, 
    loading, 
    userEmail: user?.email 
  })

  // 使用useEffect处理登录检查，避免在渲染时调用router
  useEffect(() => {
    // 移除自动重定向逻辑，让未登录用户也能浏览页面
    // 只在用户尝试使用功能时才提示登录
  }, [loading, user, router])

  // 检查是否有邮件确认成功的参数
  useEffect(() => {
    const confirmed = searchParams.get('confirmed')
    if (confirmed === 'true') {
      setShowConfirmSuccess(true)
      // 3秒后自动隐藏提示
      setTimeout(() => {
        setShowConfirmSuccess(false)
        // 清除URL参数
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('confirmed')
        window.history.replaceState({}, '', newUrl.toString())
      }, 3000)
    }
  }, [searchParams])

  // 处理退出登录
  const handleSignOut = async () => {
    const result = await signOut()
    if (result.success) {
      router.push('/')
    }
  }

  // 如果还在加载中，显示加载状态
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  function handleImageChange(file: File | null) {
    // 检查登录状态 - 如果未登录，提示用户登录
    if (!user) {
      // 显示友好的提示，而不是直接跳转
      setError("Please sign in to upload images and use AI tools.")
      return
    }
    setOriginalFile(file)
    setResultUrl(null)
    setError(null)
  }

  async function handleAction(action: 'remove' | 'enhance') {
    // 检查登录状态
    if (!user) {
      setError("Please sign in to use AI image processing features.")
      // 3秒后自动跳转到登录页面
      setTimeout(() => {
        router.push('/auth/signin?callbackUrl=/tool')
      }, 2000)
      return
    }
    
    if (!originalFile) {
      setError("Please upload an image first.")
      return
    }
    setIsLoading(true)
    setError(null)
    setResultUrl(null)
    try {
      const formData = new FormData()
      formData.append('image', originalFile)
      const api = `/api/${action === 'remove' ? 'remove-watermark' : 'enhance-image'}`
      
      const res = await fetch(api, { method: 'POST', body: formData })
      if (res.status === 401) {
        router.replace(`/auth/signin?callbackUrl=/tool`)
        return
      }
      if (res.status === 429) {
        setError('You have reached your daily free limit. Please come back tomorrow!')
        return
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Image processing failed')
      }
      const data = await res.json()
      setResultUrl(data.resultUrl)
      setRemaining(data.remaining)
    } catch (e: any) {
      setError(e.message || 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    setFeedbackStatus(null)
    setFeedbackLoading(true)
    
    try {
      // 添加超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
      
      const res = await fetch("/api/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          feedback,
          user: user ? {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email
          } : null
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "提交失败，请稍后再试")
      }
      
      setFeedback("")
      setFeedbackStatus("✅ 反馈已成功提交，感谢您的宝贵意见！")
      setShowFeedback(false)
      
    } catch (e: any) {
      console.error('Feedback submission error:', e)
      if (e.name === 'AbortError') {
        setFeedbackStatus("⏰ 提交超时，请稍后再试")
      } else {
        setFeedbackStatus("❌ " + (e.message || "提交失败，请稍后再试"))
      }
    } finally {
      setFeedbackLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 text-slate-800">
      <AuthDebug />
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                AI Watermark Remover
              </span>
            </button>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{user.user_metadata?.name || user.email}</span>
                </div>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {remaining !== null ? remaining : 10} credits left
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 邮件确认成功提示 */}
      {showConfirmSuccess && (
        <div className="bg-green-100 border border-green-300 px-4 py-3 mx-4 mt-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Email confirmed successfully! 🎉</p>
              <p className="text-green-700 text-sm">Your account is now verified and ready to use all features.</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
              AI-Powered Watermark Removal
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              <span className="block">Bring your watermarked photos back to life.</span>
              <span className="block">Let AI erase the noise and restore your images.</span>
            </p>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-center text-sm">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Original Image</h3>
              </div>
              <ImageUploader onImageChange={handleImageChange} />
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Processed Result</h3>
              </div>
              <ResultPreview resultUrl={resultUrl} isLoading={isLoading} />
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center space-y-4">
            <ToolButtons onAction={handleAction} disabled={!originalFile || isLoading} />
            {resultUrl && <DownloadButton resultUrl={resultUrl} />}
          </div>

          <div className="mt-8 text-center">
            {!showFeedback ? (
              <button
                onClick={() => setShowFeedback(true)}
                className="text-sm text-slate-600 hover:text-slate-800 underline transition-colors"
              >
                💡 Feedback & Suggestions
              </button>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="max-w-md mx-auto">
                <textarea
                  ref={feedbackRef}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your feedback, report bugs, or suggest improvements..."
                  className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    type="submit"
                    disabled={feedbackLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center space-x-2"
                  >
                    {feedbackLoading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span>{feedbackLoading ? "提交中..." : "Submit"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    disabled={feedbackLoading}
                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 disabled:bg-slate-200 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            {feedbackStatus && (
              <p className="mt-2 text-sm text-green-600">{feedbackStatus}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// 主导出组件，用Suspense包装内容组件
export default function ToolPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ToolPageContent />
    </Suspense>
  )
}