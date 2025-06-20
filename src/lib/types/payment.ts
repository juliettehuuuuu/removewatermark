// 🔥 支付提供商类型
export type PaymentProvider = "stripe" | "creem";

// 🔥 支付方式类型
export type PaymentMethod = 
  | "card" 
  | "wechat_pay" 
  | "alipay" 
  | "apple_pay" 
  | "google_pay";

// 🔥 货币类型
export type Currency = "USD" | "CNY" | "EUR" | "GBP" | "JPY";

// 🔥 产品类型
export type ProductType = "subscription" | "credits" | "one_time";

// 🔥 订单状态
export type OrderStatus = 
  | "pending" 
  | "processing" 
  | "completed" 
  | "failed" 
  | "cancelled" 
  | "expired";

// 🔥 支付创建参数
export interface CreatePaymentParams {
  userId: string;
  email: string;
  amount: number;
  currency: Currency;
  productType: ProductType;
  productId?: string;
  productName?: string;
  description?: string;
  userLocation?: string;
  preferredProvider?: PaymentProvider;
  metadata?: Record<string, any>;
}

// 🔥 支付响应
export interface PaymentResponse {
  success: boolean;
  orderId: string;
  checkoutUrl?: string;
  sessionId?: string;
  provider: PaymentProvider;
  error?: string;
}

// 🔥 Webhook事件类型
export interface WebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: any;
  created: number;
}

// 🔥 支付配置
export interface PaymentConfig {
  enableStripe: boolean;
  enableCreem: boolean;
  defaultProvider: PaymentProvider;
  autoRouting: boolean;
  testMode: boolean;
}

// 🔥 用户地理位置信息
export interface UserLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  currency: Currency;
}

// 🔥 支付路由规则
export interface PaymentRoutingRule {
  condition: {
    country?: string[];
    currency?: Currency[];
    productType?: ProductType[];
    amount?: {
      min?: number;
      max?: number;
    };
  };
  provider: PaymentProvider;
  priority: number;
}

// 🔥 支付统计
export interface PaymentStats {
  totalOrders: number;
  totalAmount: number;
  successRate: number;
  providerStats: {
    [key in PaymentProvider]: {
      orders: number;
      amount: number;
      successRate: number;
    };
  };
} 