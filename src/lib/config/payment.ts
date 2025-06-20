// 🔧 支付系统手动配置文件
// 管理员可以直接修改这个文件来控制双支付系统
// 修改后需要重启服务器生效

export const PAYMENT_CONFIG = {
  // === 🎯 主要控制开关 ===
  STRIPE_ENABLED: true,        // ✅❌ 是否启用Stripe支付
  CREEM_ENABLED: true,         // ✅❌ 是否启用Creem支付
  DEFAULT_PROVIDER: "creem" as "stripe" | "creem",   // 🎯 默认支付提供商
  MAINTENANCE_MODE: false,     // 🚧 维护模式（暂停所有支付）
  
  // === 📊 高级配置 ===
  FORCE_PROVIDER: null as "stripe" | "creem" | null,        // 🔒 强制使用指定提供商
  ALLOW_USER_CHOICE: true,     // 👤 是否允许用户选择支付方式
  
  // === 🌍 地区配置 ===
  CHINA_ONLY_CREEM: true,      // 🇨🇳 中国用户强制使用Creem
  INTERNATIONAL_PREFER_STRIPE: true, // 🌍 国际用户优先使用Stripe
  
  // === 💰 金额配置 ===
  LARGE_AMOUNT_THRESHOLD: 10000, // 大额支付阈值（分）
  LARGE_AMOUNT_PROVIDER: "stripe" as "stripe" | "creem", // 大额支付优先提供商
  
  // === 📝 配置说明 ===
  LAST_UPDATED: "2025-01-20",
  UPDATED_BY: "管理员",
  NOTES: "初始配置 - 双系统均启用"
}

// 🔍 配置验证函数
export function validatePaymentConfig() {
  const config = PAYMENT_CONFIG
  
  // 检查至少启用一个支付系统
  if (!config.STRIPE_ENABLED && !config.CREEM_ENABLED) {
    throw new Error("❌ 错误：至少需要启用一个支付系统")
  }
  
  // 检查默认提供商是否启用
  if (config.DEFAULT_PROVIDER === "stripe" && !config.STRIPE_ENABLED) {
    throw new Error("❌ 错误：默认提供商Stripe未启用")
  }
  
  if (config.DEFAULT_PROVIDER === "creem" && !config.CREEM_ENABLED) {
    throw new Error("❌ 错误：默认提供商Creem未启用")
  }
  
  // 检查强制提供商是否启用
  if (config.FORCE_PROVIDER === "stripe" && !config.STRIPE_ENABLED) {
    throw new Error("❌ 错误：强制提供商Stripe未启用")
  }
  
  if (config.FORCE_PROVIDER === "creem" && !config.CREEM_ENABLED) {
    throw new Error("❌ 错误：强制提供商Creem未启用")
  }
  
  console.log("✅ 支付配置验证通过")
  return true
}

// 🎯 获取当前活跃的支付提供商
export function getActivePaymentProvider(
  userLocation?: string,
  amount?: number,
  userPreference?: "stripe" | "creem"
): "stripe" | "creem" | null {
  
  const config = PAYMENT_CONFIG
  
  // 维护模式 - 暂停所有支付
  if (config.MAINTENANCE_MODE) {
    console.log("🚧 维护模式：所有支付已暂停")
    return null
  }
  
  // 强制提供商模式
  if (config.FORCE_PROVIDER) {
    console.log(`🔒 强制使用: ${config.FORCE_PROVIDER}`)
    return config.FORCE_PROVIDER
  }
  
  // 用户手动选择（如果允许）
  if (config.ALLOW_USER_CHOICE && userPreference) {
    if (userPreference === "stripe" && config.STRIPE_ENABLED) {
      console.log("👤 用户选择: Stripe")
      return "stripe"
    }
    if (userPreference === "creem" && config.CREEM_ENABLED) {
      console.log("👤 用户选择: Creem")
      return "creem"
    }
  }
  
  // 地区规则
  if (config.CHINA_ONLY_CREEM && userLocation === "CN" && config.CREEM_ENABLED) {
    console.log("🇨🇳 中国用户: 使用Creem")
    return "creem"
  }
  
  // 大额支付规则
  if (amount && amount >= config.LARGE_AMOUNT_THRESHOLD) {
    if (config.LARGE_AMOUNT_PROVIDER === "stripe" && config.STRIPE_ENABLED) {
      console.log("💰 大额支付: 使用Stripe")
      return "stripe"
    }
    if (config.LARGE_AMOUNT_PROVIDER === "creem" && config.CREEM_ENABLED) {
      console.log("💰 大额支付: 使用Creem")
      return "creem"
    }
  }
  
  // 国际用户优先规则
  if (config.INTERNATIONAL_PREFER_STRIPE && userLocation !== "CN" && config.STRIPE_ENABLED) {
    console.log("🌍 国际用户: 优先Stripe")
    return "stripe"
  }
  
  // 默认提供商
  if (config.DEFAULT_PROVIDER === "stripe" && config.STRIPE_ENABLED) {
    console.log("🎯 默认提供商: Stripe")
    return "stripe"
  }
  
  if (config.DEFAULT_PROVIDER === "creem" && config.CREEM_ENABLED) {
    console.log("🎯 默认提供商: Creem")
    return "creem"
  }
  
  // 备用逻辑
  if (config.STRIPE_ENABLED) {
    console.log("🔄 备用选择: Stripe")
    return "stripe"
  }
  
  if (config.CREEM_ENABLED) {
    console.log("🔄 备用选择: Creem")
    return "creem"
  }
  
  console.log("❌ 没有可用的支付提供商")
  return null
}

// 📊 获取配置状态摘要
export function getPaymentConfigSummary() {
  const config = PAYMENT_CONFIG
  
  return {
    stripe: {
      enabled: config.STRIPE_ENABLED,
      available: !!(process.env.STRIPE_PRIVATE_KEY && process.env.STRIPE_PUBLIC_KEY)
    },
    creem: {
      enabled: config.CREEM_ENABLED,
      available: !!(process.env.CREEM_API_KEY && process.env.CREEM_API_URL)
    },
    defaultProvider: config.DEFAULT_PROVIDER,
    maintenanceMode: config.MAINTENANCE_MODE,
    forceProvider: config.FORCE_PROVIDER,
    lastUpdated: config.LAST_UPDATED,
    updatedBy: config.UPDATED_BY
  }
} 