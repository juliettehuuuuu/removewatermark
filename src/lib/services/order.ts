import { prisma } from "@/lib/database";
import { Order, OrderStatus, OrderCreateParams, OrderUpdateParams, OrderQuery } from "@/lib/types/order";
import { generateOrderNo } from "@/lib/utils/hash";
import { getIsoTimestr } from "@/lib/utils/time";

/**
 * 创建订单
 */
export async function createOrder(params: OrderCreateParams): Promise<Order> {
  try {
    const orderNumber = generateOrderNo();
    
    const order = await prisma.paymentOrder.create({
      data: {
        orderNumber,
        userId: params.userId,
        amount: params.amount,
        currency: params.currency,
        status: OrderStatus.PENDING,
        paymentProvider: params.paymentProvider,
        productType: params.productType,
        productId: params.productId,
        productName: params.productName,
        description: params.description,
        customerEmail: params.userEmail,
        metadata: params.metadata || {},
        expiredAt: params.expiredAt,
      }
    });

    return mapPrismaOrderToOrder(order);
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

/**
 * 根据订单号查找订单
 */
export async function findOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  try {
    const order = await prisma.paymentOrder.findUnique({
      where: { orderNumber }
    });

    return order ? mapPrismaOrderToOrder(order) : null;
  } catch (error) {
    console.error("Error finding order by order number:", error);
    return null;
  }
}

/**
 * 根据ID查找订单
 */
export async function findOrderById(id: string): Promise<Order | null> {
  try {
    const order = await prisma.paymentOrder.findUnique({
      where: { id }
    });

    return order ? mapPrismaOrderToOrder(order) : null;
  } catch (error) {
    console.error("Error finding order by ID:", error);
    return null;
  }
}

/**
 * 更新订单
 */
export async function updateOrder(orderNumber: string, params: OrderUpdateParams): Promise<Order | null> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // 只更新提供的字段
    if (params.status !== undefined) updateData.status = params.status;
    if (params.paymentMethod !== undefined) updateData.paymentMethod = params.paymentMethod;
    if (params.stripeSessionId !== undefined) updateData.stripeSessionId = params.stripeSessionId;
    if (params.stripePaymentIntentId !== undefined) updateData.stripePaymentIntentId = params.stripePaymentIntentId;
    if (params.creemCheckoutId !== undefined) updateData.creemCheckoutId = params.creemCheckoutId;
    if (params.creemPaymentId !== undefined) updateData.creemPaymentId = params.creemPaymentId;
    if (params.paidAt !== undefined) updateData.paidAt = params.paidAt;
    if (params.paidEmail !== undefined) updateData.paidEmail = params.paidEmail;
    if (params.paidDetail !== undefined) updateData.paidDetail = params.paidDetail;
    if (params.orderDetail !== undefined) updateData.orderDetail = params.orderDetail;
    if (params.metadata !== undefined) updateData.metadata = params.metadata;

    const order = await prisma.paymentOrder.update({
      where: { orderNumber },
      data: updateData
    });

    return mapPrismaOrderToOrder(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return null;
  }
}

/**
 * 更新订单状态
 */
export async function updateOrderStatus(
  orderNumber: string, 
  status: OrderStatus, 
  paidAt?: Date,
  paidEmail?: string,
  paidDetail?: string
): Promise<Order | null> {
  return updateOrder(orderNumber, {
    status,
    paidAt,
    paidEmail,
    paidDetail
  });
}

/**
 * 更新订单支付会话ID
 */
export async function updateOrderSession(
  orderNumber: string,
  provider: string,
  sessionId: string,
  orderDetail?: string
): Promise<Order | null> {
  const updateParams: OrderUpdateParams = {
    orderDetail
  };

  if (provider === "stripe") {
    updateParams.stripeSessionId = sessionId;
  } else if (provider === "creem") {
    updateParams.creemCheckoutId = sessionId;
  }

  return updateOrder(orderNumber, updateParams);
}

/**
 * 查询用户订单
 */
export async function getOrdersByUserId(userId: string, status?: OrderStatus[]): Promise<Order[]> {
  try {
    const where: any = { userId };
    
    if (status && status.length > 0) {
      where.status = { in: status };
    }

    const orders = await prisma.paymentOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return orders.map(mapPrismaOrderToOrder);
  } catch (error) {
    console.error("Error getting orders by user ID:", error);
    return [];
  }
}

/**
 * 查询用户邮箱订单
 */
export async function getOrdersByUserEmail(userEmail: string, status?: OrderStatus[]): Promise<Order[]> {
  try {
    const where: any = { 
      OR: [
        { customerEmail: userEmail },
        { paidEmail: userEmail }
      ]
    };
    
    if (status && status.length > 0) {
      where.status = { in: status };
    }

    const orders = await prisma.paymentOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return orders.map(mapPrismaOrderToOrder);
  } catch (error) {
    console.error("Error getting orders by user email:", error);
    return [];
  }
}

/**
 * 获取用户第一个已支付订单
 */
export async function getFirstPaidOrderByUserId(userId: string): Promise<Order | null> {
  try {
    const order = await prisma.paymentOrder.findFirst({
      where: {
        userId,
        status: OrderStatus.COMPLETED
      },
      orderBy: { paidAt: 'asc' }
    });

    return order ? mapPrismaOrderToOrder(order) : null;
  } catch (error) {
    console.error("Error getting first paid order:", error);
    return null;
  }
}

/**
 * 获取已支付订单列表（分页）
 */
export async function getPaidOrders(page: number = 1, limit: number = 20): Promise<Order[]> {
  try {
    const offset = (page - 1) * limit;
    
    const orders = await prisma.paymentOrder.findMany({
      where: { status: OrderStatus.COMPLETED },
      orderBy: { paidAt: 'desc' },
      skip: offset,
      take: limit
    });

    return orders.map(mapPrismaOrderToOrder);
  } catch (error) {
    console.error("Error getting paid orders:", error);
    return [];
  }
}

/**
 * 获取已支付订单总数
 */
export async function getPaidOrdersTotal(): Promise<number> {
  try {
    return await prisma.paymentOrder.count({
      where: { status: OrderStatus.COMPLETED }
    });
  } catch (error) {
    console.error("Error getting paid orders total:", error);
    return 0;
  }
}

/**
 * 根据日期获取订单统计
 */
export async function getOrderCountByDate(
  startDate: Date,
  endDate?: Date,
  status?: OrderStatus
): Promise<Map<string, number>> {
  try {
    const where: any = {
      createdAt: {
        gte: startDate
      }
    };

    if (endDate) {
      where.createdAt.lte = endDate;
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.paymentOrder.findMany({
      where,
      select: {
        createdAt: true
      }
    });

    const countMap = new Map<string, number>();
    
    orders.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
    });

    return countMap;
  } catch (error) {
    console.error("Error getting order count by date:", error);
    return new Map();
  }
}

/**
 * 标记过期订单
 */
export async function markExpiredOrders(): Promise<number> {
  try {
    const now = new Date();
    
    const result = await prisma.paymentOrder.updateMany({
      where: {
        status: OrderStatus.PENDING,
        expiredAt: {
          lte: now
        }
      },
      data: {
        status: OrderStatus.EXPIRED,
        updatedAt: now
      }
    });

    console.log(`✅ 标记了 ${result.count} 个过期订单`);
    return result.count;
  } catch (error) {
    console.error("Error marking expired orders:", error);
    return 0;
  }
}

/**
 * 清理过期订单（可选：物理删除）
 */
export async function cleanupExpiredOrders(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await prisma.paymentOrder.deleteMany({
      where: {
        status: OrderStatus.EXPIRED,
        updatedAt: {
          lte: cutoffDate
        }
      }
    });

    console.log(`🗑️ 清理了 ${result.count} 个过期订单`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up expired orders:", error);
    return 0;
  }
}

/**
 * 复杂查询订单
 */
export async function queryOrders(query: OrderQuery): Promise<Order[]> {
  try {
    const where: any = {};

    if (query.userId) where.userId = query.userId;
    if (query.userEmail) {
      where.OR = [
        { customerEmail: query.userEmail },
        { paidEmail: query.userEmail }
      ];
    }
    if (query.status) {
      if (Array.isArray(query.status)) {
        where.status = { in: query.status };
      } else {
        where.status = query.status;
      }
    }
    if (query.paymentProvider) where.paymentProvider = query.paymentProvider;
    if (query.productType) where.productType = query.productType;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = query.dateFrom;
      if (query.dateTo) where.createdAt.lte = query.dateTo;
    }

    const orders = await prisma.paymentOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.offset || 0,
      take: query.limit || 50
    });

    return orders.map(mapPrismaOrderToOrder);
  } catch (error) {
    console.error("Error querying orders:", error);
    return [];
  }
}

/**
 * 将Prisma订单对象映射为Order接口
 */
function mapPrismaOrderToOrder(prismaOrder: any): Order {
  return {
    id: prismaOrder.id,
    orderNumber: prismaOrder.orderNumber,
    userId: prismaOrder.userId,
    userEmail: prismaOrder.customerEmail || "",
    amount: prismaOrder.amount,
    currency: prismaOrder.currency,
    status: prismaOrder.status as OrderStatus,
    paymentProvider: prismaOrder.paymentProvider,
    paymentMethod: prismaOrder.paymentMethod,
    productType: prismaOrder.productType,
    productId: prismaOrder.productId || "",
    productName: prismaOrder.productName || "",
    description: prismaOrder.description,
    
    stripeSessionId: prismaOrder.stripeSessionId,
    stripePaymentIntentId: prismaOrder.stripePaymentIntentId,
    creemCheckoutId: prismaOrder.creemCheckoutId,
    creemPaymentId: prismaOrder.creemPaymentId,
    
    metadata: prismaOrder.metadata,
    customerEmail: prismaOrder.customerEmail,
    customerName: prismaOrder.customerName,
    orderDetail: prismaOrder.orderDetail,
    
    createdAt: prismaOrder.createdAt,
    updatedAt: prismaOrder.updatedAt,
    paidAt: prismaOrder.paidAt,
    expiredAt: prismaOrder.expiredAt,
    
    paidEmail: prismaOrder.paidEmail,
    paidDetail: prismaOrder.paidDetail,
  };
} 