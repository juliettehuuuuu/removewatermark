import React from 'react'

// 下载按钮组件
// props: resultUrl (可选) - 处理后图片的URL
export function DownloadButton({ resultUrl }: { resultUrl?: string }) {
  // 处理下载图片
  async function handleDownload() {
    if (resultUrl) {
      try {
        // 用fetch获取图片Blob
        const response = await fetch(resultUrl)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        // 创建a标签下载
        const link = document.createElement('a')
        link.href = url
        link.download = 'processed-image.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (e) {
        alert('Download failed')
      }
    }
  }

  return (
    <button
      type="button"
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
      onClick={handleDownload}
      disabled={!resultUrl}
    >
      Download Result
    </button>
  )
} 