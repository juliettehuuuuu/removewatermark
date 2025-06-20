import React from 'react'

// 功能按钮组件，包含去水印、高清化
// props: onAction (可选) - 按钮点击时的回调，参数为操作类型
export function ToolButtons({ onAction }: { onAction?: (action: 'remove' | 'enhance') => void }) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => onAction?.('remove')}
      >
        Remove Watermark
      </button>
      <button
        type="button"
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => onAction?.('enhance')}
      >
        Enhance Image
      </button>
    </div>
  )
} 