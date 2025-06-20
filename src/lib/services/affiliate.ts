import { prisma } from "@/lib/database"
import { getIsoTimestr } from "@/lib/utils/time"

// 推荐系统常量 - 按照Shipany模板标准
export const AffiliateRewardPercent = {
  Paid: 10, // 推荐人获得10%佣金
} as const

export const AffiliateRewardAmount = {
  Paid: 100, // 固定奖励100分（如果有的话）
} as const

export const AffiliateStatus = {
  Pending: "pending",
  Completed: "completed",
  Cancelled: "cancelled",
} as const

// 推荐记录接口
export interface AffiliateRecord {
  id?: string
  userId: string
  invitedBy: string
  orderId: string
  orderAmount: number
  rewardPercent: number
  rewardAmount: number
  status: string
  createdAt: string
}

/**
 * 处理订单的推荐奖励 - 按照Shipany模板标准
 */
export async function updateAffiliateForOrder(order: any) {
  try {
    // 1. 查找用户信息
    const user = await prisma.user.findUnique({
      where: { id: order.userId }
    })

    if (!user || !user.id) {
      console.log(`📈 用户不存在，跳过推荐处理: ${order.userId}`)
      return
    }

    // 2. 检查用户是否有推荐人
    // TODO: 添加推荐人字段到用户表
    // const invitedBy = user.invitedBy
    const invitedBy = null // 暂时设为null，等待添加字段

    if (!invitedBy || invitedBy === user.id) {
      console.log(`📈 用户无推荐人，跳过推荐处理: ${user.email}`)
      return
    }

    // 3. 检查是否已经处理过这个订单
    // TODO: 创建推荐记录表
    // const existingAffiliate = await prisma.affiliateRecord.findFirst({
    //   where: { orderId: order.id }
    // })

    // if (existingAffiliate) {
    //   console.log(`📈 订单已处理过推荐奖励: ${order.orderNumber}`)
    //   return
    // }

    // 4. 计算推荐奖励
    const rewardPercent = AffiliateRewardPercent.Paid
    const rewardAmount = Math.floor((order.amount * rewardPercent) / 100)

    console.log(`📈 计算推荐奖励: 订单${order.orderNumber}, 金额${order.amount}, 奖励${rewardAmount}`)

    // 5. 创建推荐记录
    // TODO: 实现推荐记录创建
    // await prisma.affiliateRecord.create({
    //   data: {
    //     userId: user.id,
    //     invitedBy,
    //     orderId: order.id,
    //     orderAmount: order.amount,
    //     rewardPercent,
    //     rewardAmount,
    //     status: AffiliateStatus.Completed,
    //     createdAt: getIsoTimestr()
    //   }
    // })

    // 6. 给推荐人增加奖励积分
    // TODO: 实现推荐人奖励
    // await prisma.user.update({
    //   where: { id: invitedBy },
    //   data: {
    //     credits: { increment: rewardAmount }
    //   }
    // })

    console.log(`✅ 推荐奖励处理完成: 用户${user.email}, 推荐人${invitedBy}, 奖励${rewardAmount}`)

  } catch (error) {
    console.error("❌ 推荐系统处理失败:", error)
    // 推荐系统失败不影响主流程，只记录错误
  }
}

/**
 * 生成推荐码
 */
export function generateInviteCode(userId: string): string {
  // 简单的推荐码生成逻辑
  const timestamp = Date.now().toString(36)
  const userHash = userId.slice(-6)
  return `${userHash}${timestamp}`.toUpperCase()
}

/**
 * 验证推荐码
 */
export async function validateInviteCode(inviteCode: string): Promise<string | null> {
  try {
    // TODO: 实现推荐码验证逻辑
    // const user = await prisma.user.findFirst({
    //   where: { inviteCode }
    // })
    // return user?.id || null
    
    console.log(`📈 验证推荐码: ${inviteCode} (待实现)`)
    return null
  } catch (error) {
    console.error("❌ 推荐码验证失败:", error)
    return null
  }
}

/**
 * 获取用户的推荐统计
 */
export async function getUserAffiliateStats(userId: string) {
  try {
    // TODO: 实现推荐统计查询
    // const stats = await prisma.affiliateRecord.aggregate({
    //   where: { invitedBy: userId, status: AffiliateStatus.Completed },
    //   _count: { id: true },
    //   _sum: { rewardAmount: true }
    // })

    // return {
    //   totalInvites: stats._count.id || 0,
    //   totalRewards: stats._sum.rewardAmount || 0
    // }

    console.log(`📈 获取推荐统计: ${userId} (待实现)`)
    return {
      totalInvites: 0,
      totalRewards: 0
    }
  } catch (error) {
    console.error("❌ 获取推荐统计失败:", error)
    return {
      totalInvites: 0,
      totalRewards: 0
    }
  }
} 