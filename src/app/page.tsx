'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { StructuredData } from '@/components/StructuredData'
import { Navigation } from '@/components/Navigation'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { AuthDebug } from '@/components/AuthDebug'

export default function HomePage() {
  const { user, loading } = useAuthContext()
  return (
    <>
      <StructuredData />
      <Navigation />
      <AuthDebug />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <section className="relative pt-20 md:pt-32 pb-24 px-4 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/40 to-indigo-100/60"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-6xl mx-auto text-center">
            {/* Main headline with better typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight mb-6">
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Restore Unusable Images
              </span>
              <span className="block bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mt-2">
                to Professional Quality
              </span>
            </h1>
            
            {/* Subtitle with improved hierarchy */}
            <div className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              <p className="mb-3 font-medium text-gray-700">
                Turn watermarked and damaged images into valuable assets
              </p>
              <p className="mb-3">
                Boost your productivity with AI-powered image restoration
              </p>
              <p className="text-blue-600 font-semibold">
                Make every image usable again
              </p>
            </div>
            
            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/tool">
                <Button size="lg" className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  {user ? 'Continue Processing' : 'Start Processing Now'}
                </Button>
              </Link>
              {!loading && !user && (
                <Link href="/auth/signin">
                  <Button variant="outline" size="lg" className="text-lg px-10 py-4 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                    Sign In
                  </Button>
                </Link>
              )}
              {user && (
                <div className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  ✅ Logged in as {user.user_metadata?.name || user.email}
                </div>
              )}
            </div>
            
            {/* Trust indicators */}
            <div className="text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                <span>No watermarks</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                </svg>
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>Professional Results</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Transform Unusable Images into 
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Professional Assets
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Powerful AI technology that breathes new life into your images
              </p>
            </div>
            
            {/* Feature cards */}
            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 overflow-hidden">
                <CardHeader className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-4 text-gray-900">Smart Watermark Removal</CardTitle>
                      <CardDescription className="text-gray-600 text-lg leading-relaxed">
                        Remove watermarks, logos, and unwanted elements from your images instantly. Transform unusable stock photos, social media images, and downloaded content into clean, professional assets for your projects.
                      </CardDescription>
                      
                      {/* Benefits list */}
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700">Preserves original image quality</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700">Works on complex backgrounds</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-700">Instant processing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 overflow-hidden">
                <CardHeader className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-4 text-gray-900">Image Enhancement & Restoration</CardTitle>
                      <CardDescription className="text-gray-600 text-lg leading-relaxed">
                        Enhance blurry, low-quality images and restore old or damaged photos. Improve clarity, color balance, and detail to make every image presentation-ready and boost your work efficiency.
                      </CardDescription>
                      
                      {/* Benefits list */}
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700">AI-powered upscaling</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700">Color correction & balance</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-gray-700">Detail enhancement</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-30"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-5xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Start Transforming Your Images 
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-2">
                Today
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Join thousands of professionals who trust our AI to restore their images and accelerate their workflow. Turn every unusable image into a valuable asset.
            </p>
            
            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-10 text-blue-200">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-red-400 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-orange-400 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-sm">1000+ satisfied users</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <span className="text-sm">4.9/5 rating</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {!loading && !user && (
                <Link href="/auth/signup">
                  <Button size="lg" className="text-lg px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0">
                    Start Free Trial
                  </Button>
                </Link>
              )}
              {user && (
                <Link href="/tool">
                  <Button size="lg" className="text-lg px-12 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-0">
                    Use AI Tools Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
