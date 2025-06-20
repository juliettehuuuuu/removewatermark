import React from 'react'
import { Eraser, Sparkles } from 'lucide-react'

// 工具按钮组件
export function ToolButtons({ 
  onAction,
  disabled 
}: { 
  onAction: (action: 'remove' | 'enhance') => void,
  disabled?: boolean
}) {
  const baseClasses = "flex-1 group relative overflow-hidden text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
  const disabledClasses = "disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* 去水印按钮 */}
      <button
        onClick={() => onAction('remove')}
        disabled={disabled}
        className={`${baseClasses} bg-blue-600 hover:bg-blue-700 ${disabledClasses}`}
      >
        <div className="relative flex items-center justify-center space-x-2">
          <Eraser className="w-5 h-5" />
          <span>Remove Watermark</span>
        </div>
      </button>

      {/* 增强图片按钮 */}
      <button
        onClick={() => onAction('enhance')}
        disabled={disabled}
        className={`${baseClasses} bg-green-600 hover:bg-green-700 ${disabledClasses}`}
      >
        <div className="relative flex items-center justify-center space-x-2">
          <Sparkles className="w-5 h-5" />
          <span>Enhance Image</span>
        </div>
      </button>
    </div>
  )
} 