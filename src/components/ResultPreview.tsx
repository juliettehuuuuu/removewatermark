import React from 'react'
import { Image as ImageIcon, CheckCircle } from 'lucide-react'

// 结果预览组件
export function ResultPreview({ resultUrl, isLoading }: { resultUrl?: string | null, isLoading?: boolean }) {
  const content = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500">Processing...</p>
        </div>
      )
    }
    if (resultUrl) {
      return (
        <div className="relative group w-full h-full">
          <img 
            src={resultUrl} 
            alt="Processed Result" 
            className="w-full h-full object-contain rounded-lg" 
          />
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Success</span>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <ImageIcon className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">No result yet</p>
        <p className="text-slate-400 text-sm text-center">
          Your processed image will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center p-2">
      {content()}
    </div>
  )
} 