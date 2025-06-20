"use client"
import React, { useState, useRef, useEffect } from 'react'
import { ImageUploader } from '@/components/ImageUploader'
import { ResultPreview } from '@/components/ResultPreview'
import { ToolButtons } from '@/components/ToolButtons'
import { DownloadButton } from '@/components/DownloadButton'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles, Image as ImageIcon, Upload, LogOut } from 'lucide-react'

// 工具页主页面
export default function ToolPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null)
  const feedbackRef = useRef<HTMLTextAreaElement>(null)

  // 添加调试信息
  console.log('🔍 Tool页面状态:', { 
    session: !!session, 
    status, 
    user: session?.user?.email 
  })

  // 使用useEffect处理登录检查，避免在渲染时调用router
  useEffect(() => {
    if (status === "unauthenticated") {
      // 只在未认证状态下重定向，避免重复重定向
      console.log('🔍 用户未登录，但允许浏览页面')
    }
  }, [status, router])

  // 处理退出登录
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // 如果session还在加载中，显示加载状态
  if (status === "loading") {
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
    // 检查登录状态
    if (!session) {
      router.push('/auth/signin?callbackUrl=/tool')
      return
    }
    setOriginalFile(file)
    setResultUrl(null)
    setError(null)
  }

  async function handleAction(action: 'remove' | 'enhance') {
    // 检查登录状态
    if (!session) {
      router.push('/auth/signin?callbackUrl=/tool')
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
    try {
      const res = await fetch("/api/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      })
      if (!res.ok) throw new Error("提交失败，请稍后再试")
      setFeedback("")
      setFeedbackStatus("反馈已成功提交，感谢您的宝贵意见！")
      setShowFeedback(false)
    } catch (e) {
      setFeedbackStatus("提交失败，请稍后再试")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 text-slate-800">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                AI Watermark Remover
              </span>
            </div>
            {session && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{session.user?.name || session.user?.email}</span>
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

      <main className="flex-grow flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
              AI-Powered Watermark Removal
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Bring your watermarked photos back to life. Let AI erase the noise and restore your images.
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

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6 mt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-slate-900 text-center md:text-left">Choose Your Action</h3>
                  <p className="text-slate-500 text-sm text-center md:text-left">Select an option to transform your image.</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3">
                <ToolButtons onAction={handleAction} disabled={isLoading || !originalFile} />
              </div>
              <div className="flex-shrink-0">
                <DownloadButton resultUrl={resultUrl} />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="px-4 py-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white rounded-lg font-semibold shadow hover:from-pink-600 hover:to-yellow-600 transition-all"
                onClick={() => setShowFeedback(true)}
              >
                Feedback
              </button>
            </div>
            {showFeedback && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-2 text-slate-900">Submit Feedback</h2>
                  <form onSubmit={handleSubmitFeedback}>
                    <textarea
                      ref={feedbackRef}
                      className="w-full h-28 border border-slate-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800"
                      placeholder="Please enter your suggestions or issues..."
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300"
                        onClick={() => setShowFeedback(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                  {feedbackStatus && (
                    <div className="mt-3 text-center text-green-600 font-medium">{feedbackStatus}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 