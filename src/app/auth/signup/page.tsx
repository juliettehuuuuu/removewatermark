import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignUpContent } from '@/components/SignUpContent'

export const metadata: Metadata = {
  title: 'Sign Up - Create Your Remove Watermark AI Account | Remove Watermark AI',
  description: 'Create your free Remove Watermark AI account to access professional AI watermark removal tools. Start removing watermarks from images with advanced AI technology today.',
  keywords: [
    'remove watermark ai registration',
    'remove watermark ai sign up',
    'flux kontext registration',
    'ai image generator account',
    'flux kontext sign up',
    'free ai image generation',
    'ai image creation account'
  ],
  alternates: {
    canonical: '/auth/signup',
  },
  openGraph: {
    title: 'Sign Up for Remove Watermark AI',
    description: 'Create your free AI image generation account',
    url: '/auth/signup',
  },
  robots: {
    index: false,
    follow: true,
  },
}

// 加载组件
function SignUpLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading sign up page...</p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpLoading />}>
      <SignUpContent />
    </Suspense>
  )
} 