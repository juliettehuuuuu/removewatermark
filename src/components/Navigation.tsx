"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthContext } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { ChevronDown, User, LogOut, Code, BookOpen } from "lucide-react"
// 导入文案系统
import { common } from "@/lib/content"

export function Navigation() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuthContext()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false)
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.resources-dropdown') && !target.closest('.user-dropdown')) {
        setIsResourcesMenuOpen(false)
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { href: "/", label: common.navigation.home },
    { href: "/generate", label: common.navigation.generate },
    { href: "/pricing", label: common.navigation.pricing },
    { 
      href: "/resources", 
      label: common.navigation.resources,
      hasDropdown: true,
      subItems: [
        { href: "/resources", label: common.navigation.resourcesHub, icon: BookOpen },
        { href: "/resources/api", label: common.navigation.apiDocs, icon: Code }
      ]
    }
  ]

  const handleSignOut = async () => {
    console.log('🔍 开始登出...')
    const result = await signOut()
    if (result.success) {
      console.log('✅ 登出成功')
      // 可以手动跳转到首页
      window.location.href = '/'
    } else {
      console.error('❌ 登出失败:', result.error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center">
        {/* 左侧：Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-xl font-bold text-primary">
            Remove Watermark AI
          </Link>
        </div>
        
        {/* 中间：桌面端导航菜单 - 居中显示 */}
        <nav className="hidden md:flex items-center justify-center flex-1 space-x-8">
          {navLinks.map((link) => (
            <div key={link.href} className="relative">
              {link.hasDropdown ? (
                // Resources下拉菜单
                <div className="relative resources-dropdown">
                  <button
                    onClick={() => setIsResourcesMenuOpen(!isResourcesMenuOpen)}
                    className={`flex items-center space-x-1 relative transition-all duration-200 hover:font-semibold active:scale-95 ${
                      pathname.startsWith('/resources') 
                        ? 'text-primary font-semibold' 
                        : 'text-foreground hover:text-primary'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isResourcesMenuOpen ? 'rotate-180' : ''}`} />
                    {pathname.startsWith('/resources') && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                  
                  {/* Resources下拉菜单内容 */}
                  {isResourcesMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-2 z-[9999]">
                      {link.subItems?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className="flex items-center space-x-3 px-4 py-2 text-sm transition-colors hover:bg-accent"
                          onClick={() => setIsResourcesMenuOpen(false)}
                        >
                          <subItem.icon className="w-4 h-4 text-primary" />
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // 普通导航链接
                <Link 
                  href={link.href} 
                  className={`relative transition-all duration-200 hover:font-semibold active:scale-95 ${
                    pathname === link.href 
                      ? 'text-primary font-semibold' 
                      : 'text-foreground hover:text-primary'
                  }`}
                >
                  {link.label}
                  {pathname === link.href && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* 右侧：桌面端用户状态和按钮 */}
        <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
          {loading ? (
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : user ? (
            // 已登录状态
            <div className="relative user-dropdown">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{user.user_metadata?.name || user.email}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* 用户下拉菜单 */}
              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg py-2 z-[9999]">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm transition-colors hover:bg-accent"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    {common.navigation.dashboard}
                  </Link>
                  <hr className="my-2 border-border" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{common.buttons.signOut}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 未登录状态
            <>
              <Link href="/auth/signin">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:font-semibold active:scale-95 transition-all duration-200"
                >
                  {common.navigation.login}
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button 
                  size="sm" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  {common.buttons.signUp}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* 移动端汉堡菜单按钮 */}
        <div className="md:hidden flex-shrink-0">
          <button
            className="p-2 hover:bg-accent rounded-md active:scale-95 transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`block w-5 h-5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
              <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'my-0.5'}`} />
              <span className={`block w-5 h-0.5 bg-foreground transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <div key={link.href}>
                {link.hasDropdown ? (
                  // Resources菜单项
                  <div>
                    <div
                      className={`block py-2 text-sm font-medium ${
                        pathname.startsWith('/resources') ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {link.label}
                    </div>
                    <div className="ml-4 space-y-2">
                      {link.subItems?.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className="flex items-center space-x-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    className={`block py-2 text-sm font-medium transition-colors ${
                      pathname === link.href ? 'text-primary' : 'text-foreground hover:text-primary'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            
            {/* 移动端用户状态 */}
            <div className="pt-4 border-t border-border">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : user ? (
                // 已登录状态
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{user.user_metadata?.name || user.email}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      href="/dashboard"
                      className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {common.navigation.dashboard}
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{common.buttons.signOut}</span>
                    </button>
                  </div>
                </div>
              ) : (
                // 未登录状态
                <div className="space-y-3">
                  <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      {common.navigation.login}
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      {common.buttons.signUp}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
} 