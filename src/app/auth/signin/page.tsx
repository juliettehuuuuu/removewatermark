import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignInContent } from '@/components/SignInContent'

export const metadata: Metadata = {
  title: 'Sign In - Access Your Remove Watermark AI Account | Remove Watermark AI',
  description: 'Sign in to your Remove Watermark AI account to access AI-powered watermark removal tools. Remove watermarks from images with advanced AI technology instantly.',
  keywords: [
    'remove watermark ai account',
    'remove watermark ai sign in'
  ],
  alternates: {
    canonical: '/auth/signin',
  },
  openGraph: {
    title: 'Sign In to Remove Watermark AI',
    description: 'Access your AI image generation account',
    url: '/auth/signin',
  },
  robots: {
    index: false, // 登录页面不需要被搜索引擎索引
    follow: true,
  }
}

// 加载组件
function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading sign in page...</p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInContent />
    </Suspense>
  )
} 