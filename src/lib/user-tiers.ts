// 用户分层系统核心逻辑

export enum UserType {
  ANONYMOUS = 'anonymous',
  REGISTERED = 'registered', 
  PREMIUM = 'premium'
}

export interface UserLimits {
  maxImages: number
  modelsAllowed: string[]
  aspectRatios: string[] | 'all'
  hourlyLimit: number
  requiresTurnstile: boolean | 'smart'
  storageRetention: number // 天数
  features: {
    batchGeneration: boolean
    privateMode: boolean
    historySync: boolean
    priorityQueue: boolean
    templates?: boolean
    favorites?: boolean
    apiAccess?: boolean
    commercialLicense?: boolean
  }
}

// 免费用户限制
export const freeUserLimits: UserLimits = {
  maxImages: 2,
  modelsAllowed: ['pro'],
  aspectRatios: 'all',
  hourlyLimit: 10,
  requiresTurnstile: true,
  storageRetention: 7,
  features: {
    batchGeneration: false,
    privateMode: false,
    historySync: false,
    priorityQueue: false
  }
}

// 注册用户限制
export const registeredUserLimits: UserLimits = {
  maxImages: 4,
  modelsAllowed: ['pro', 'max'],
  aspectRatios: 'all',
  hourlyLimit: 30,
  requiresTurnstile: 'smart',
  storageRetention: 30,
  features: {
    batchGeneration: false,
    privateMode: false,
    historySync: true,
    priorityQueue: false,
    templates: true,
    favorites: true
  }
}

// 付费用户限制
export const premiumUserLimits: UserLimits = {
  maxImages: 12,
  modelsAllowed: ['pro', 'max'],
  aspectRatios: 'all',
  hourlyLimit: Infinity,
  requiresTurnstile: false,
  storageRetention: Infinity,
  features: {
    batchGeneration: true,
    privateMode: true,
    historySync: true,
    priorityQueue: true,
    templates: true,
    favorites: true,
    apiAccess: true,
    commercialLicense: true
  }
}

// 获取用户限制
export const getUserLimits = (userType: UserType): UserLimits => {
  switch (userType) {
    case UserType.ANONYMOUS:
      return freeUserLimits
    case UserType.REGISTERED:
      return registeredUserLimits
    case UserType.PREMIUM:
      return premiumUserLimits
    default:
      return freeUserLimits
  }
}

// 图片数量选项
export const getImageCountOptions = (userType: UserType) => {
  const limits = getUserLimits(userType)
  const baseOptions = [
    { value: 1, label: "1 image", premium: false },
    { value: 2, label: "2 images", premium: false }
  ]
  
  if (limits.maxImages >= 3) {
    baseOptions.push({ value: 3, label: "3 images", premium: false })
  }
  
  if (limits.maxImages >= 4) {
    baseOptions.push({ value: 4, label: "4 images", premium: false })
  }
  
  // 付费用户专享选项
  if (userType === UserType.PREMIUM) {
    baseOptions.push(
      { value: 6, label: "6 images 👑", premium: true },
      { value: 8, label: "8 images 👑", premium: true },
      { value: 12, label: "12 images 👑", premium: true }
    )
  }
  
  return baseOptions
}

// 模型选择权限
export const getAvailableModels = (userType: UserType) => {
  const limits = getUserLimits(userType)
  return limits.modelsAllowed
}

// 宽高比选项权限
export const getAvailableAspectRatios = (userType: UserType) => {
  return [
    { value: "1:1", label: "1:1", icon: "⬜", premium: false },
    { value: "16:9", label: "16:9", icon: "📺", premium: false },
    { value: "9:16", label: "9:16", icon: "📱", premium: false },
    { value: "4:3", label: "4:3", icon: "🖼️", premium: false },
    { value: "3:4", label: "3:4", icon: "📄", premium: false },
    { value: "3:2", label: "3:2", icon: "📷", premium: false },
    { value: "2:3", label: "2:3", icon: "📖", premium: false },
    { value: "21:9", label: "21:9", icon: "🎬", premium: false },
    { value: "9:21", label: "9:21", icon: "🏢", premium: false },
    { value: "5:4", label: "5:4", icon: "🖼️", premium: false },
    { value: "4:5", label: "4:5", icon: "📄", premium: false },
    { value: "7:5", label: "7:5", icon: "📷", premium: false },
    { value: "5:7", label: "5:7", icon: "📖", premium: false }
  ]
}

// 检查功能权限
export const hasFeature = (userType: UserType, feature: keyof UserLimits['features']): boolean => {
  const limits = getUserLimits(userType)
  return limits.features[feature] || false
}

// 检查是否需要升级提示
export const needsUpgrade = (userType: UserType, requestedImages: number): boolean => {
  const limits = getUserLimits(userType)
  return requestedImages > limits.maxImages
}

// 获取升级建议
export const getUpgradeSuggestion = (userType: UserType, feature?: string) => {
  switch (userType) {
    case UserType.ANONYMOUS:
      return {
        title: "Sign Up for Free",
        description: "Unlock Max model, more images and history features",
        action: "Sign Up Free",
        nextTier: UserType.REGISTERED
      }
    case UserType.REGISTERED:
      return {
        title: "Upgrade to Premium",
        description: "Unlock batch generation, private mode and unlimited usage",
        action: "Upgrade Premium",
        nextTier: UserType.PREMIUM
      }
    case UserType.PREMIUM:
      return null
  }
}

// 定价方案
export const pricingPlans = {
  monthly: {
    price: 29,
    currency: 'USD',
    period: 'month',
    credits: 1000,
    features: [
      'Batch generation 1-12 images',
      'Private Mode for personal use',
      'Priority queue for fast generation',
      'Unlimited usage frequency',
      'Permanent image storage',
      'Commercial license included',
      'API developer access',
      'Dedicated customer support'
    ]
  },
  yearly: {
    price: 290,
    currency: 'USD',
    period: 'year',
    credits: 15000,
    discount: 'Save 20%',
    features: [
      'All monthly features included',
      '3 extra months free',
      'Early access to new features',
      'Exclusive community access'
    ]
  }
}

// 模拟用户状态（实际应该从后端获取）
export const getCurrentUserType = (): UserType => {
  // 检查是否在浏览器环境
  if (typeof window === 'undefined') {
    return UserType.ANONYMOUS
  }
  
  try {
    // 检查用户登录状态（从localStorage或其他状态管理获取）
    const userSession = localStorage.getItem('user-session')
    if (userSession) {
      const session = JSON.parse(userSession)
      
      // 检查是否为付费用户
      if (session.isPremium || session.subscription?.status === 'active') {
        return UserType.PREMIUM
      }
      
      // 检查是否为注册用户
      if (session.user?.email) {
        return UserType.REGISTERED
      }
    }
    
    // 也可以检查NextAuth session
    // 这里可以添加更复杂的用户状态检测逻辑
    
  } catch (error) {
    console.warn('User status detection failed:', error)
  }
  
  // 默认返回匿名用户
  return UserType.ANONYMOUS
} 