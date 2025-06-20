// 首页多语言配置和类型定义

export interface HomeDictionary {
  hero: {
    badge: string
    title: string
    subtitle: string
    description: string
    cta: {
      primary: string
      secondary: string
    }
  }
  features: {
    title: string
    subtitle: string
    items: Array<{
      title: string
      description: string
    }>
  }
  faq: {
    title: string
    subtitle: string
    items: Array<{
      question: string
      answer: string
    }>
  }
  cta: {
    title: string
    subtitle: string
    button: string
  }
  footer: {
    brand: {
      name: string
      description: string
      copyright: string
    }
    contact: {
      title: string
      email: string
    }
    legal: {
      title: string
      terms: string
      privacy: string
      refund: string
    }
    languages: {
      title: string
    }
    social: {
      builtWith: string
      followUs: string
    }
  }
}

// 支持的语言列表
export const SUPPORTED_LOCALES = [
  'en',  // English (默认)
  'zh',  // 中文
  'de',  // Deutsch
  'es',  // Español
  'fr',  // Français
  'it',  // Italiano
  'ja',  // 日本語
  'ko',  // 한국어
  'nl',  // Nederlands
  'pl',  // Polski
  'pt',  // Português
  'ru',  // Русский
  'tr',  // Türkçe
  'ar',  // العربية
  'hi',  // हिन्दी
  'bn'   // বাংলা
] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

// 语言显示名称和旗帜
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  'en': 'English',
  'zh': '中文',
  'de': 'Deutsch',
  'es': 'Español',
  'fr': 'Français',
  'it': 'Italiano',
  'ja': '日本語',
  'ko': '한국어',
  'nl': 'Nederlands',
  'pl': 'Polski',
  'pt': 'Português',
  'ru': 'Русский',
  'tr': 'Türkçe',
  'ar': 'العربية',
  'hi': 'हिन्दी',
  'bn': 'বাংলা'
}

export const LOCALE_FLAGS: Record<SupportedLocale, string> = {
  'en': '🇺🇸',
  'zh': '🇨🇳',
  'de': '🇩🇪',
  'es': '🇪🇸',
  'fr': '🇫🇷',
  'it': '🇮🇹',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'nl': '🇳🇱',
  'pl': '🇵🇱',
  'pt': '🇵🇹',
  'ru': '🇷🇺',
  'tr': '🇹🇷',
  'ar': '🇸🇦',
  'hi': '🇮🇳',
  'bn': '🇧🇩'
}

// 默认语言
export const DEFAULT_LOCALE: SupportedLocale = 'en'

// 英语默认内容
export const EN_DICTIONARY: HomeDictionary = {
  hero: {
    badge: "Professional AI Image Generation Platform",
    title: "Create Stunning Images with",
    subtitle: "Flux Kontext AI",
    description: "Transform your ideas into professional images with our cutting-edge AI technology. Generate images from text, edit existing images, and process multiple images with the power of Flux Kontext AI.",
    cta: {
      primary: "Start Creating",
      secondary: "View Pricing"
    }
  },
  features: {
    title: "Key Features of Flux Kontext AI Platform",
    subtitle: "Our Flux Kontext AI combines cutting-edge technology to deliver professional image generation and editing in one seamless platform.",
    items: [
      {
        title: "Text to Image Generation",
        description: "Transform your text descriptions into stunning, high-quality images with advanced AI technology."
      },
      {
        title: "Professional Image Editing",
        description: "Edit existing images with natural language instructions for precise modifications."
      },
      {
        title: "Multi-Image Processing",
        description: "Process multiple images simultaneously with consistent style and quality."
      }
    ]
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Find answers to common questions about our Flux Kontext AI platform and its powerful image generation features.",
    items: [
      {
        question: "What is Flux Kontext AI?",
        answer: "Flux Kontext AI is an advanced image generation platform that uses cutting-edge artificial intelligence to create stunning images from text descriptions, edit existing images, and process multiple images simultaneously."
      },
      {
        question: "How does text-to-image generation work?",
        answer: "Our AI analyzes your text description and generates high-quality images using advanced Flux Pro and Max models. Simply describe what you want to see, and our AI creates professional-grade images in seconds."
      }
    ]
  },
  cta: {
    title: "Ready to Create Amazing Images?",
    subtitle: "Join thousands of creators using Flux Kontext AI to bring their ideas to life.",
    button: "Get Started Now"
  },
  footer: {
    brand: {
      name: "Flux Kontext",
      description: "Professional AI image generation platform. Create stunning images from text, edit existing images, and process multiple images with advanced AI technology.",
      copyright: "© 2025 Flux Kontext. All rights reserved."
    },
    contact: {
      title: "Contact",
      email: "support@fluxkontext.space"
    },
    legal: {
      title: "Legal",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      refund: "Refund Policy"
    },
    languages: {
      title: "Languages"
    },
    social: {
      builtWith: "Built with ❤️ for creators worldwide",
      followUs: "Follow us on"
    }
  }
}

// 获取指定语言的字典
export function getDictionary(locale: SupportedLocale): HomeDictionary {
  // 目前只返回英语内容，后续可以扩展其他语言
  return EN_DICTIONARY
} 