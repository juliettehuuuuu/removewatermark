import React, { useRef, useState } from 'react'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { Upload, Image as ImageIcon, X } from 'lucide-react'

// 图片上传组件
export function ImageUploader({ onImageChange }: { onImageChange?: (file: File | null) => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, loading } = useAuthContext()
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      onImageChange?.(file)
    } else {
      setImageUrl(null)
      onImageChange?.(null)
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files?.[0]?.type.startsWith('image/')) {
      const file = e.dataTransfer.files[0]
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      onImageChange?.(file)
    }
  }

  function handleClear() {
    setImageUrl(null)
    onImageChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleClick() {
    if (!loading && !user) {
      router.push('/auth/signin?callbackUrl=/tool')
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      {imageUrl ? (
        <div className="relative group">
          <img 
            src={imageUrl} 
            alt="Original" 
            className="w-full h-64 object-contain rounded-lg bg-slate-50 border border-slate-200 pointer-events-none" 
            draggable="false"
            onContextMenu={(e) => e.preventDefault()} // 禁用右键菜单
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-slate-700 font-medium">Click to upload or drag & drop</p>
          <p className="text-slate-500 text-sm">PNG, JPG, WEBP (max 5MB)</p>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
} 