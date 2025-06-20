import React from 'react'
import { Download } from 'lucide-react'

// 下载按钮组件
export function DownloadButton({ resultUrl }: { resultUrl?: string | null }) {
  // 下载图片
  async function handleDownload() {
    if (!resultUrl) return
    
    try {
      // 如果是 data URL，直接下载
      if (resultUrl.startsWith('data:')) {
        const link = document.createElement('a')
        link.href = resultUrl
        link.download = 'processed-image.png'
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      
      // 如果是外部 URL，先获取图片数据再下载
      const response = await fetch(resultUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch image')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = 'processed-image.png'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download failed:', error)
      // 如果 fetch 失败，尝试直接下载（可能被 CORS 阻止）
      const link = document.createElement('a')
      link.href = resultUrl
      link.download = 'processed-image.png'
      link.target = '_blank' // 在新标签页打开，避免在当前页面显示
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={!resultUrl}
      className="group relative flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md transform hover:-translate-y-0.5 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none bg-indigo-600 text-white hover:bg-indigo-700"
    >
      <Download className="w-5 h-5" />
      <span>Download</span>
    </button>
  )
} 