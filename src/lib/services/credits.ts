import { prisma } from '@/lib/database'
import { getUuid } from '@/lib/utils/hash'

// 🔥 积分操作类型
export type CreditTransactionType = 'purchase' | 'usage' | 'gift' | 'refund' | 'bonus'

// 🔥 积分操作接口
export interface CreditOperation {
  userId: string
  amount: number
  type: CreditTransactionType
  description: string
  referenceId?: string
  metadata?: any
}

// 🔥 积分检查结果
export interface CreditCheckResult {
  hasEnoughCredits: boolean
  currentCredits: number
  requiredCredits: number
  shortfall: number
}

// 🔥 积分操作结果
export interface CreditOperationResult {
  success: boolean
  transaction?: any
  user?: any
  error?: string
}

/**
 * 检查用户积分余额
 */
export async function checkUserCredits(
  userId: string, 
  requiredCredits: number = 2
): Promise<CreditCheckResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    const currentCredits = user?.credits || 0
    const hasEnoughCredits = currentCredits >= requiredCredits
    const shortfall = hasEnoughCredits ? 0 : requiredCredits - currentCredits

    return {
      hasEnoughCredits,
      currentCredits,
      requiredCredits,
      shortfall
    }
  } catch (error) {
    console.error('积分检查失败:', error)
    return {
      hasEnoughCredits: false,
      currentCredits: 0,
      requiredCredits,
      shortfall: requiredCredits
    }
  }
}

/**
 * 消耗用户积分
 */
export async function consumeUserCredits(
  operation: CreditOperation
): Promise<CreditOperationResult> {
  try {
    const { userId, amount, type, description, referenceId, metadata } = operation

    // 检查积分余额
    const creditCheck = await checkUserCredits(userId, amount)
    if (!creditCheck.hasEnoughCredits) {
      return {
        success: false,
        error: `积分余额不足，当前余额: ${creditCheck.currentCredits}，需要: ${amount}`
      }
    }

    // 扣除积分
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount
        }
      }
    })

    // 创建交易记录
    const transaction = await prisma.creditTransaction.create({
      data: {
        id: getUuid(),
        userId,
        amount: -amount, // 负数表示消耗
        type,
        description,
        referenceId: referenceId || `${type}_${Date.now()}`,
        metadata: {
          originalAmount: amount,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      }
    })

    return {
      success: true,
      transaction,
      user: {
        id: userId,
        creditsAfter: updatedUser.credits,
        creditsConsumed: amount
      }
    }

  } catch (error) {
    console.error('积分消耗失败:', error)
    return {
      success: false,
      error: '积分消耗操作失败'
    }
  }
}

/**
 * 赠送用户积分
 */
export async function grantUserCredits(
  operation: CreditOperation
): Promise<CreditOperationResult> {
  try {
    const { userId, amount, type, description, referenceId, metadata } = operation

    // 增加积分
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount
        }
      }
    })

    // 创建交易记录
    const transaction = await prisma.creditTransaction.create({
      data: {
        id: getUuid(),
        userId,
        amount, // 正数表示获得
        type,
        description,
        referenceId: referenceId || `${type}_${Date.now()}`,
        metadata: {
          grantedAmount: amount,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      }
    })

    return {
      success: true,
      transaction,
      user: {
        id: userId,
        creditsAfter: updatedUser.credits,
        creditsGranted: amount
      }
    }

  } catch (error) {
    console.error('积分赠送失败:', error)
    return {
      success: false,
      error: '积分赠送操作失败'
    }
  }
}

/**
 * 获取用户积分历史
 */
export async function getUserCreditHistory(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const transactions = await prisma.creditTransaction.findMany()
    
    // 由于Supabase适配器限制，这里返回空数组
    // 实际使用时需要根据具体的数据库适配器实现
    return []
  } catch (error) {
    console.error('获取积分历史失败:', error)
    return []
  }
}

/**
 * 生图专用积分消耗函数 - 🔧 根据模型和操作类型计算积分
 */
export async function consumeCreditsForImageGeneration(
  userId: string,
  imagePrompt: string,
  action: string = 'text-to-image-pro'
): Promise<CreditOperationResult> {
  // 🔧 根据操作类型计算积分消耗
  const getCreditsRequired = (action: string): number => {
    switch (action) {
      // PRO系列：15积分
      case 'text-to-image-pro':
      case 'edit-image-pro':
      case 'edit-multi-image-pro':
        return 15
      
      // MAX系列：30积分
      case 'text-to-image-max':
      case 'edit-image-max':
        return 30
      
      // 多图编辑MAX：45积分（30基础+15额外）
      case 'edit-multi-image-max':
        return 45
      
      // 其他模型
      case 'text-to-image-schnell':
        return 8
      case 'text-to-image-dev':
        return 12
      case 'text-to-image-realism':
      case 'text-to-image-anime':
        return 20
      
      // 默认PRO积分
      default:
        return 15
    }
  }

  const creditsRequired = getCreditsRequired(action)
  
  console.log(`💰 Credits calculation: ${action} requires ${creditsRequired} credits`)

  return await consumeUserCredits({
    userId,
    amount: creditsRequired,
    type: 'usage',
    description: `AI图像生成 - ${action}`,
    referenceId: `image_gen_${Date.now()}`,
    metadata: {
      action,
      model: action.replace('text-to-image-', '').replace('edit-image-', '').replace('edit-multi-image-', ''),
      prompt: imagePrompt.substring(0, 100), // 只保存前100个字符
      creditsRequired
    }
  })
}

/**
 * 新用户注册积分赠送
 */
export async function grantWelcomeCredits(
  userId: string,
  userEmail: string
): Promise<CreditOperationResult> {
  return await grantUserCredits({
    userId,
    amount: 100,
    type: 'gift',
    description: '新用户注册赠送积分',
    referenceId: 'welcome_bonus',
    metadata: {
      action: 'welcome_bonus',
      userEmail,
      grantedAt: new Date().toISOString()
    }
  })
} 