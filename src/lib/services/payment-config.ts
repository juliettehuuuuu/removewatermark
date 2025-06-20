import { prisma } from "@/lib/database"

// 支付系统配置接口
export interface PaymentSystemConfig {
  id: string
  stripeEnabled: boolean
  creemEnabled: boolean
  defaultProvider: "stripe" | "creem"
  maintenanceMode: boolean
  lastUpdatedBy: string
  lastUpdatedAt: Date
  notes?: string
}

// 支付系统状态
export interface PaymentSystemStatus {
  stripe: {
    enabled: boolean
    available: boolean
    lastTest?: Date
    errorMessage?: string
  }
  creem: {
    enabled: boolean
    available: boolean
    lastTest?: Date
    errorMessage?: string
  }
  activeProvider: "stripe" | "creem" | "both" | "none"
  maintenanceMode: boolean
}

/**
 * 获取当前支付系统配置
 */
export async function getPaymentConfig(): Promise<PaymentSystemConfig> {
  try {
    // 从数据库获取配置，如果不存在则创建默认配置
    let config = await prisma.paymentConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    })

    if (!config) {
      // 创建默认配置
      config = await prisma.paymentConfig.create({
        data: {
          stripeEnabled: true,
          creemEnabled: true,
          defaultProvider: "creem", // 默认使用Creem
          maintenanceMode: false,
          lastUpdatedBy: "system",
          notes: "初始化配置"
        }
      })
    }

    return {
      id: config.id,
      stripeEnabled: config.stripeEnabled,
      creemEnabled: config.creemEnabled,
      defaultProvider: config.defaultProvider as "stripe" | "creem",
      maintenanceMode: config.maintenanceMode,
      lastUpdatedBy: config.lastUpdatedBy,
      lastUpdatedAt: config.updatedAt,
      notes: config.notes || undefined
    }
  } catch (error) {
    console.error("❌ 获取支付配置失败:", error)
    // 返回默认配置
    return {
      id: "default",
      stripeEnabled: true,
      creemEnabled: true,
      defaultProvider: "creem",
      maintenanceMode: false,
      lastUpdatedBy: "system",
      lastUpdatedAt: new Date()
    }
  }
}

/**
 * 更新支付系统配置 - 管理员专用
 */
export async function updatePaymentConfig(
  updates: Partial<Omit<PaymentSystemConfig, 'id' | 'lastUpdatedAt'>>,
  adminEmail: string
): Promise<PaymentSystemConfig> {
  try {
    // 验证配置的合理性
    if (updates.stripeEnabled === false && updates.creemEnabled === false) {
      throw new Error("至少需要启用一个支付系统")
    }

    // 如果只启用一个系统，自动设置为默认提供商
    if (updates.stripeEnabled === true && updates.creemEnabled === false) {
      updates.defaultProvider = "stripe"
    } else if (updates.stripeEnabled === false && updates.creemEnabled === true) {
      updates.defaultProvider = "creem"
    }

    const config = await prisma.paymentConfig.create({
      data: {
        stripeEnabled: updates.stripeEnabled ?? true,
        creemEnabled: updates.creemEnabled ?? true,
        defaultProvider: updates.defaultProvider ?? "creem",
        maintenanceMode: updates.maintenanceMode ?? false,
        lastUpdatedBy: adminEmail,
        notes: updates.notes
      }
    })

    console.log(`✅ 支付配置更新成功: 管理员=${adminEmail}`)
    console.log(`📊 新配置: Stripe=${config.stripeEnabled}, Creem=${config.creemEnabled}, 默认=${config.defaultProvider}`)

    return {
      id: config.id,
      stripeEnabled: config.stripeEnabled,
      creemEnabled: config.creemEnabled,
      defaultProvider: config.defaultProvider as "stripe" | "creem",
      maintenanceMode: config.maintenanceMode,
      lastUpdatedBy: config.lastUpdatedBy,
      lastUpdatedAt: config.updatedAt,
      notes: config.notes || undefined
    }
  } catch (error) {
    console.error("❌ 更新支付配置失败:", error)
    throw error
  }
}

/**
 * 获取支付系统实时状态
 */
export async function getPaymentSystemStatus(): Promise<PaymentSystemStatus> {
  try {
    const config = await getPaymentConfig()
    
    // 检查Stripe可用性
    const stripeAvailable = await checkStripeAvailability()
    
    // 检查Creem可用性
    const creemAvailable = await checkCreemAvailability()
    
    // 确定当前活跃的提供商
    let activeProvider: "stripe" | "creem" | "both" | "none" = "none"
    
    if (config.maintenanceMode) {
      activeProvider = "none"
    } else if (config.stripeEnabled && config.creemEnabled && stripeAvailable && creemAvailable) {
      activeProvider = "both"
    } else if (config.stripeEnabled && stripeAvailable) {
      activeProvider = "stripe"
    } else if (config.creemEnabled && creemAvailable) {
      activeProvider = "creem"
    }

    return {
      stripe: {
        enabled: config.stripeEnabled,
        available: stripeAvailable,
        lastTest: new Date(),
        errorMessage: stripeAvailable ? undefined : "API密钥配置错误或服务不可用"
      },
      creem: {
        enabled: config.creemEnabled,
        available: creemAvailable,
        lastTest: new Date(),
        errorMessage: creemAvailable ? undefined : "API密钥配置错误或服务不可用"
      },
      activeProvider,
      maintenanceMode: config.maintenanceMode
    }
  } catch (error) {
    console.error("❌ 获取支付系统状态失败:", error)
    return {
      stripe: { enabled: false, available: false, errorMessage: "系统错误" },
      creem: { enabled: false, available: false, errorMessage: "系统错误" },
      activeProvider: "none",
      maintenanceMode: true
    }
  }
}

/**
 * 检查Stripe可用性
 */
async function checkStripeAvailability(): Promise<boolean> {
  try {
    if (!process.env.STRIPE_PRIVATE_KEY) {
      return false
    }
    
    // 这里可以添加实际的Stripe API测试
    // 比如获取账户信息或创建一个测试价格
    return true
  } catch (error) {
    console.error("❌ Stripe可用性检查失败:", error)
    return false
  }
}

/**
 * 检查Creem可用性
 */
async function checkCreemAvailability(): Promise<boolean> {
  try {
    if (!process.env.CREEM_API_KEY || !process.env.CREEM_API_URL) {
      return false
    }
    
    // 这里可以添加实际的Creem API测试
    // 比如获取产品列表或账户信息
    return true
  } catch (error) {
    console.error("❌ Creem可用性检查失败:", error)
    return false
  }
}

/**
 * 快速切换支付提供商 - 管理员专用
 */
export async function switchPaymentProvider(
  targetProvider: "stripe" | "creem",
  adminEmail: string
): Promise<PaymentSystemConfig> {
  try {
    const updates: Partial<PaymentSystemConfig> = {
      defaultProvider: targetProvider,
      notes: `快速切换到${targetProvider === "stripe" ? "Stripe" : "Creem"}支付系统`
    }

    // 启用目标提供商，禁用另一个
    if (targetProvider === "stripe") {
      updates.stripeEnabled = true
      updates.creemEnabled = false
    } else {
      updates.stripeEnabled = false
      updates.creemEnabled = true
    }

    return await updatePaymentConfig(updates, adminEmail)
  } catch (error) {
    console.error("❌ 切换支付提供商失败:", error)
    throw error
  }
}

/**
 * 启用维护模式 - 暂停所有支付
 */
export async function enableMaintenanceMode(
  adminEmail: string,
  reason?: string
): Promise<PaymentSystemConfig> {
  return await updatePaymentConfig({
    maintenanceMode: true,
    notes: `维护模式启用: ${reason || "系统维护"}`
  }, adminEmail)
}

/**
 * 禁用维护模式 - 恢复支付服务
 */
export async function disableMaintenanceMode(
  adminEmail: string
): Promise<PaymentSystemConfig> {
  return await updatePaymentConfig({
    maintenanceMode: false,
    notes: "维护模式已禁用，支付服务恢复正常"
  }, adminEmail)
} 