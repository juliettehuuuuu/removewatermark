import { prisma } from "@/lib/database"
import { PaymentProvider, ProductType } from "@/lib/payment"
import { getIsoTimestr } from "@/lib/utils/time"

// 订单创建参数接口
export interface CreateOrderParams {
  userId: string
  orderNumber: string
  amount: number
  currency: string
  paymentProvider: PaymentProvider
  productType: ProductType
  productId?: string
  productName?: string
  customerEmail?: string
  metadata?: any
  expiredAt?: Date
}

// 订单更新参数接口
export interface UpdateOrderParams {
  status?: string
  paidAt?: Date
  paidEmail?: string
  paidDetail?: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  stripeCustomerId?: string
  creemCheckoutId?: string
  creemPaymentId?: string
  metadata?: any
}

/**
 * 创建支付订单 - 统一双支付系统
 */
export async function createPaymentOrder(params: CreateOrderParams) {
  try {
    const order = await prisma.paymentOrder.create({
      data: {
        userId: params.userId,
        orderNumber: params.orderNumber,
        amount: params.amount,
        currency: params.currency,
        status: "pending",
        paymentProvider: params.paymentProvider,
        productType: params.productType,
        productId: params.productId,
        productName: params.productName,
        customerEmail: params.customerEmail,
        metadata: params.metadata,
        expiredAt: params.expiredAt,
        createdAt: new Date(),
      }
    })

    console.log(`✅ 订单创建成功: ${order.orderNumber} (${params.paymentProvider})`)
    return order
  } catch (error) {
    console.error("❌ 创建订单失败:", error)
    throw error
  }
}

/**
 * 更新订单信息 - 支持Stripe和Creem
 */
export async function updatePaymentOrder(orderId: string, params: UpdateOrderParams) {
  try {
    const order = await prisma.paymentOrder.update({
      where: { id: orderId },
      data: {
        ...params,
        updatedAt: new Date(),
      }
    })

    console.log(`✅ 订单更新成功: ${order.orderNumber} - ${params.status || '状态未变'}`)
    return order
  } catch (error) {
    console.error("❌ 更新订单失败:", error)
    throw error
  }
}

/**
 * 根据订单ID查找订单
 */
export async function findOrderById(orderId: string) {
  try {
    return await prisma.paymentOrder.findUnique({
      where: { id: orderId },
      include: { user: true }
    })
  } catch (error) {
    console.error("❌ 查找订单失败:", error)
    return null
  }
}

/**
 * 根据订单号查找订单
 */
export async function findOrderByNumber(orderNumber: string) {
  try {
    return await prisma.paymentOrder.findUnique({
      where: { orderNumber },
      include: { user: true }
    })
  } catch (error) {
    console.error("❌ 查找订单失败:", error)
    return null
  }
}

/**
 * 根据Stripe Session ID查找订单
 */
export async function findOrderByStripeSession(sessionId: string) {
  try {
    return await prisma.paymentOrder.findUnique({
      where: { stripeSessionId: sessionId },
      include: { user: true }
    })
  } catch (error) {
    console.error("❌ 查找Stripe订单失败:", error)
    return null
  }
}

/**
 * 根据Creem Checkout ID查找订单
 */
export async function findOrderByCreemCheckout(checkoutId: string) {
  try {
    return await prisma.paymentOrder.findUnique({
      where: { creemCheckoutId: checkoutId },
      include: { user: true }
    })
  } catch (error) {
    console.error("❌ 查找Creem订单失败:", error)
    return null
  }
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(userId: string, limit: number = 20) {
  try {
    return await prisma.paymentOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true }
    })
  } catch (error) {
    console.error("❌ 获取用户订单失败:", error)
    return []
  }
}

/**
 * 获取支付提供商统计 - 用于自动切换
 */
export async function getPaymentProviderStats(hours: number = 24) {
  try {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    const stats = await prisma.paymentOrder.groupBy({
      by: ['paymentProvider'],
      where: {
        createdAt: { gte: startTime },
        status: { in: ['pending', 'processing', 'completed'] }
      },
      _count: { id: true },
      _max: { createdAt: true }
    })

    return stats.map(stat => ({
      provider: stat.paymentProvider as PaymentProvider,
      count: stat._count.id,
      lastUsed: stat._max.createdAt || new Date(0)
    }))
  } catch (error) {
    console.error("❌ 获取支付统计失败:", error)
    return []
  }
}

/**
 * 获取过期订单
 */
export async function getExpiredOrders() {
  try {
    return await prisma.paymentOrder.findMany({
      where: {
        status: 'pending',
        expiredAt: { lt: new Date() }
      },
      include: { user: true }
    })
  } catch (error) {
    console.error("❌ 获取过期订单失败:", error)
    return []
  }
}

/**
 * 批量更新过期订单状态
 */
export async function markOrdersAsExpired(orderIds: string[]) {
  try {
    const result = await prisma.paymentOrder.updateMany({
      where: { id: { in: orderIds } },
      data: { 
        status: 'expired',
        updatedAt: new Date()
      }
    })

    console.log(`✅ 标记${result.count}个订单为过期`)
    return result
  } catch (error) {
    console.error("❌ 标记过期订单失败:", error)
    throw error
  }
}

/**
 * 获取订单统计数据
 */
export async function getOrderStatistics(userId?: string) {
  try {
    const whereClause = userId ? { userId } : {}
    
    const [total, completed, pending, failed] = await Promise.all([
      prisma.paymentOrder.count({ where: whereClause }),
      prisma.paymentOrder.count({ where: { ...whereClause, status: 'completed' } }),
      prisma.paymentOrder.count({ where: { ...whereClause, status: 'pending' } }),
      prisma.paymentOrder.count({ where: { ...whereClause, status: 'failed' } })
    ])

    const totalRevenue = await prisma.paymentOrder.aggregate({
      where: { ...whereClause, status: 'completed' },
      _sum: { amount: true }
    })

    return {
      total,
      completed,
      pending,
      failed,
      totalRevenue: totalRevenue._sum.amount || 0
    }
  } catch (error) {
    console.error("❌ 获取订单统计失败:", error)
    return {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      totalRevenue: 0
    }
  }
} 