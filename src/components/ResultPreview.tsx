import React from 'react'

// 处理后图片展示组件
// props: resultUrl (可选) - 处理后图片的URL
export function ResultPreview({ resultUrl }: { resultUrl?: string }) {
  return (
    <div className="w-full flex flex-col items-center">
      {/* 处理后图片预览区 */}
      {resultUrl ? (
        <img src={resultUrl} alt="Processed" className="max-h-64 rounded shadow mb-4" />
      ) : (
        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded mb-4 text-gray-400">
          No result yet
        </div>
      )}
    </div>
  )
} 