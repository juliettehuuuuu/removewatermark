import React from 'react'
import { Download } from 'lucide-react'

// 下载按钮组件
export function DownloadButton({ resultUrl }: { resultUrl?: string | null }) {
  // 下载图片
  function handleDownload() {
    if (!resultUrl) return
    
    const link = document.createElement('a')
    link.href = resultUrl
    link.download = 'processed-image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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