export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentProvider: string;
  paymentMethod?: string;
  productType: string;
  productId: string;
  productName: string;
  description?: string;
  
  // 支付提供商相关字段
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  creemCheckoutId?: string;
  creemPaymentId?: string;
  
  // 订阅相关字段
  interval?: string; // "month", "year", "one-time"
  validMonths?: number;
  credits?: number;
  
  // 订阅详细信息
  subId?: string;
  subIntervalCount?: number;
  subCycleAnchor?: number;
  subPeriodEnd?: number;
  subPeriodStart?: number;
  subTimes?: number;
  
  // 元数据
  metadata?: any;
  customerEmail?: string;
  customerName?: string;
  orderDetail?: string;
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  expiredAt?: Date;
  
  // 支付详情
  paidEmail?: string;
  paidDetail?: string;
}

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing", 
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  REFUNDED = "refunded"
}

export interface OrderCreateParams {
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentProvider: string;
  productType: string;
  productId: string;
  productName: string;
  description?: string;
  interval?: string;
  validMonths?: number;
  credits?: number;
  metadata?: any;
  expiredAt?: Date;
}

export interface OrderUpdateParams {
  status?: OrderStatus;
  paymentMethod?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  creemCheckoutId?: string;
  creemPaymentId?: string;
  paidAt?: Date;
  paidEmail?: string;
  paidDetail?: string;
  orderDetail?: string;
  metadata?: any;
}

export interface OrderQuery {
  userId?: string;
  userEmail?: string;
  status?: OrderStatus | OrderStatus[];
  paymentProvider?: string;
  productType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
} 