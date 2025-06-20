"use client"
import React from 'react'
import { Sparkles, Wand2 } from 'lucide-react'

// 工具按钮组件
export function ToolButtons({ 
  onAction,
  disabled 
}: { 
  onAction: (action: 'remove' | 'enhance') => void,
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* 去水印按钮 */}
      <button
        onClick={() => onAction('remove')}
        disabled={disabled}
        className="w-full sm:w-auto flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform duration-200 ease-in-out shadow-lg"
      >
        <Wand2 className="w-5 h-5 mr-2" />
        Remove Watermark
      </button>

      {/* 增强图片按钮 */}
      <button
        onClick={() => onAction('enhance')}
        disabled={disabled}
        className="w-full sm:w-auto flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-transform duration-200 ease-in-out shadow-lg"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Enhance Image
      </button>
    </div>
  )
} 