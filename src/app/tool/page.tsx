"use client"
import React, { useState } from 'react'
import { ImageUploader } from '@/components/ImageUploader'
import { ResultPreview } from '@/components/ResultPreview'
import { ToolButtons } from '@/components/ToolButtons'
import { DownloadButton } from '@/components/DownloadButton'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles, Image as ImageIcon, Upload } from 'lucide-react'

// 工具页主页面
export default function ToolPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()
  const [remaining, setRemaining] = useState<number | null>(null)

  function handleImageChange(file: File | null) {
    setOriginalFile(file)
    setResultUrl(null)
    setError(null)
  }

  async function handleAction(action: 'remove' | 'enhance') {
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
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
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
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
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Original Image</h3>
              </div>
              <ImageUploader onImageChange={handleImageChange} />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Processed Result</h3>
              </div>
              <ResultPreview resultUrl={resultUrl} isLoading={isLoading} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mt-6">
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
          </div>
        </div>
      </main>
    </div>
  )
} 