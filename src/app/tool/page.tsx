"use client"
import React, { useState, useEffect } from 'react'
import { ImageUploader } from '@/components/ImageUploader'
import { ResultPreview } from '@/components/ResultPreview'
import { ToolButtons } from '@/components/ToolButtons'
import { DownloadButton } from '@/components/DownloadButton'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// 工具页主页面，客户端组件，管理图片和处理状态
export default function ToolPage() {
  // 原图文件和URL
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  // 处理后图片URL
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  // 错误信息
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const router = useRouter()
  // 剩余免费次数
  const [remaining, setRemaining] = useState<number | null>(null)

  // 处理图片上传
  function handleImageChange(file: File | null, url: string | null) {
    setOriginalFile(file)
    setOriginalUrl(url)
    setResultUrl(null) // 每次上传新图片时清空结果
    setError(null)
  }

  // 处理功能按钮点击
  async function handleAction(action: 'remove' | 'enhance' | 'tune') {
    if (!originalFile) return
    setIsLoading(true)
    setError(null)
    setResultUrl(null)
    try {
      // 构造FormData上传图片
      const formData = new FormData()
      formData.append('image', originalFile)
      // 根据操作类型选择API
      let api = '/api/remove-watermark'
      if (action === 'enhance') api = '/api/enhance-image'
      if (action === 'tune') api = '/api/tune-image'
      // 请求后端API
      const res = await fetch(api, { method: 'POST', body: formData })
      if (res.status === 401) {
        router.replace(`/auth/signin?callbackUrl=/tool`)
        return
      }
      if (res.status === 429) {
        setError('You have reached your daily free limit. Please come back tomorrow!')
        return
      }
      if (!res.ok) throw new Error('Image processing failed')
      const data = await res.json()
      setResultUrl(data.resultUrl)
      setRemaining(data.remaining)
    } catch (e: any) {
      setError(e.message || 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white overflow-hidden">
      <main className="relative z-10 min-h-screen py-8 px-4">
        {/* 页面标题和简介 */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 via-orange-300 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            AI Image Watermark Remover
          </h1>
          <p className="text-gray-600">Remove watermarks, enhance image quality, and fine-tune your images with AI. Upload your image to get started!</p>
          {/* 显示今日剩余免费次数 */}
          {session && (
            <div className="mt-4 text-lg text-blue-700 font-semibold">
              Free uses left today: {remaining !== null ? remaining : 10}/10
            </div>
          )}
        </div>
        {/* 错误提示 */}
        {error && <div className="max-w-2xl mx-auto mb-4 text-red-600 text-center">{error}</div>}
        {/* 左右分栏：左侧原图，右侧处理后图片 */}
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          <div className="flex-1 bg-white rounded-lg shadow p-4 flex items-center justify-center min-h-[320px]">
            {/* 原图上传与预览 */}
            <ImageUploader onImageChange={handleImageChange} />
          </div>
          <div className="flex-1 bg-white rounded-lg shadow p-4 flex items-center justify-center min-h-[320px]">
            {/* 处理后图片预览 */}
            <ResultPreview resultUrl={resultUrl || undefined} />
          </div>
        </div>
        {/* 功能按钮区和下载按钮 */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <ToolButtons onAction={handleAction} />
          <DownloadButton resultUrl={resultUrl || undefined} />
          {/* 加载中提示 */}
          {isLoading && <div className="text-blue-600 mt-2">Processing, please wait...</div>}
        </div>
      </main>
    </div>
  )
} 