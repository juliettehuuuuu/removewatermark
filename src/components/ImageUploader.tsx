import React, { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// 图片上传组件，支持选择图片并预览
// props: onImageChange (可选) - 图片更改时的回调
export function ImageUploader({ onImageChange }: { onImageChange?: (file: File | null, url: string | null) => void }) {
  // 用于存储用户选择的图片文件
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { status } = useSession()
  const router = useRouter()

  // 处理文件选择事件
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      onImageChange?.(file, url)
    } else {
      setImageUrl(null)
      onImageChange?.(null, null)
    }
  }

  // 触发文件选择，未登录则跳转登录页
  function handleClick() {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/tool')
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* 图片预览区 */}
      {imageUrl ? (
        <img src={imageUrl} alt="Original" className="max-h-64 rounded shadow mb-4" />
      ) : (
        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded mb-4 text-gray-400">
          No image selected
        </div>
      )}
      {/* 上传按钮 */}
      <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleClick}>
        Upload Image
      </button>
      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
} 