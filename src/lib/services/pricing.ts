import { PricingPage, PricingItem, CheckoutParams, PaymentValidationResult } from "@/lib/types/pricing";

// 定价配置 - 这里可以从数据库或配置文件读取
const PRICING_CONFIG: PricingPage = {
  pricing: {
    name: "pricing",
    label: "Pricing",
    title: "Choose Your Plan",
    description: "Select the perfect plan for your AI image generation needs",
    groups: [],
    items: [
      // Subscription Plans
      {
        title: "Basic",
        description: "Perfect for hobbyists and beginners",
        features_title: "Includes",
        features: [
          "4000 credits per month",
          "720p video resolution",
          "Max 5 second videos",
          "Standard processing speed"
        ],
        interval: "month",
        amount: 2990, // $29.90 in cents
        currency: "USD",
        price: "$29.9",
        unit: "month",
        is_featured: false,
        tip: "Perfect for getting started",
        button: {
          title: "Subscribe",
          url: "/checkout"
        },
        product_id: "basic_monthly",
        product_name: "Basic Monthly Subscription",
        credits: 4000,
        valid_months: 1
      },
      {
        title: "Basic",
        description: "Perfect for hobbyists and beginners",
        features_title: "Includes",
        features: [
          "4000 credits per month",
          "720p video resolution",
          "Max 5 second videos",
          "Standard processing speed"
        ],
        interval: "year",
        amount: 26990, // $269.90 in cents
        currency: "USD",
        price: "$269.9",
        unit: "year",
        is_featured: false,
        tip: "Save 25% with annual billing",
        button: {
          title: "Subscribe",
          url: "/checkout"
        },
        product_id: "basic_yearly",
        product_name: "Basic Yearly Subscription",
        credits: 48000, // 4000 * 12
        valid_months: 12
      },
      {
        title: "Plus",
        description: "For creators and professionals",
        label: "Popular",
        features_title: "Includes",
        features: [
          "7500 credits per month",
          "1080p video resolution",
          "Max 8 second videos",
          "Priority processing",
          "Commercial usage rights",
          "Priority support"
        ],
        interval: "month",
        amount: 4990, // $49.90 in cents
        currency: "USD",
        price: "$49.9",
        unit: "month",
        is_featured: true,
        tip: "Most popular choice",
        button: {
          title: "Subscribe",
          url: "/checkout"
        },
        product_id: "plus_monthly",
        product_name: "Plus Monthly Subscription",
        credits: 7500,
        valid_months: 1
      },
      {
        title: "Plus",
        description: "For creators and professionals",
        label: "Popular",
        features_title: "Includes",
        features: [
          "7500 credits per month",
          "1080p video resolution",
          "Max 8 second videos",
          "Priority processing",
          "Commercial usage rights",
          "Priority support"
        ],
        interval: "year",
        amount: 44990, // $449.90 in cents
        currency: "USD",
        price: "$449.9",
        unit: "year",
        is_featured: true,
        tip: "Save 25% with annual billing",
        button: {
          title: "Subscribe",
          url: "/checkout"
        },
        product_id: "plus_yearly",
        product_name: "Plus Yearly Subscription",
        credits: 90000, // 7500 * 12
        valid_months: 12
      },
      {
        title: "Pro",
        description: "For teams and businesses",
        features_title: "Includes",
        features: [
          "16000 credits per month",
          "1080p video resolution",
          "Max 8 second videos",
          "Fastest processing",
          "Commercial usage rights",
          "Priority support"
        ],
        interval: "month",
        amount: 9990, // $99.90 in cents
        currency: "USD",
        price: "$99.9",
        unit: "month",
        is_featured: false,
        tip: "For teams and businesses",
        button: {
          title: "Subscribe",
          url: "/checkout"
        },
        product_id: "pro_monthly",
        product_name: "Pro Monthly Subscription",
        credits: 16000,
        valid_months: 1
      },
      {
        title: "Pro",
        description: "For teams and businesses",
        features_title: "Includes",
        features: [
          "16000 credits per month",
          "1080p video resolution",
          "Max 8 second videos",
          "Fastest processing",
          "Commercial usage rights",
          "Priority support"
        ],
        interval: "year",
        amount: 89990, // $899.90 in cents
        currency: "USD",
        price: "$899.9",
        unit: "year",
        is_featured: false,
        tip: "Save 25% with annual billing",
        button: {
          title: "Subscribe",
          url: "/checkout"
        },
        product_id: "pro_yearly",
        product_name: "Pro Yearly Subscription",
        credits: 192000, // 16000 * 12
        valid_months: 12
      },
      // Credit Packs
      {
        title: "Starter Pack",
        description: "Great for occasional use",
        features_title: "Includes",
        features: [
          "Never expires"
        ],
        interval: "one-time",
        amount: 4990, // $49.90 in cents
        currency: "USD",
        price: "$49.9",
        unit: "USD",
        is_featured: false,
        tip: "Great for occasional use",
        button: {
          title: "Purchase",
          url: "/checkout"
        },
        product_id: "starter_pack",
        product_name: "Starter Credit Pack",
        credits: 8000,
        valid_months: 12 // 永不过期，设置为12个月
      },
      {
        title: "Creator Pack",
        description: "Ideal for professional creators",
        label: "Popular",
        features_title: "Includes",
        features: [
          "Never expires"
        ],
        interval: "one-time",
        amount: 9990, // $99.90 in cents
        currency: "USD",
        price: "$99.9",
        unit: "USD",
        is_featured: true,
        tip: "Most popular choice",
        button: {
          title: "Purchase",
          url: "/checkout"
        },
        product_id: "creator_pack",
        product_name: "Creator Credit Pack",
        credits: 18000,
        valid_months: 12 // 永不过期，设置为12个月
      },
      {
        title: "Business Pack",
        description: "Best value for businesses & heavy users",
        features_title: "Includes",
        features: [
          "Never expires"
        ],
        interval: "one-time",
        amount: 19990, // $199.90 in cents
        currency: "USD",
        price: "$199.9",
        unit: "USD",
        is_featured: false,
        tip: "Best value for businesses",
        button: {
          title: "Purchase",
          url: "/checkout"
        },
        product_id: "business_pack",
        product_name: "Business Credit Pack",
        credits: 40000,
        valid_months: 12 // 永不过期，设置为12个月
      }
    ]
  }
};

/**
 * 获取定价页面配置
 */
export async function getPricingPage(locale: string = "en"): Promise<PricingPage> {
  // 这里可以根据locale返回不同语言的配置
  // 暂时返回英文配置
  return PRICING_CONFIG;
}

/**
 * 根据product_id查找定价项目
 */
export async function findPricingItem(productId: string): Promise<PricingItem | null> {
  const page = await getPricingPage();
  return page.pricing.items.find(item => item.product_id === productId) || null;
}

/**
 * 验证支付参数
 */
export async function validateCheckoutParams(params: CheckoutParams): Promise<PaymentValidationResult> {
  const { credits, currency, amount, interval, product_id, product_name, valid_months } = params;

  // 基础参数验证
  if (!amount || !interval || !currency || !product_id) {
    return {
      isValid: false,
      error: "Missing required parameters"
    };
  }

  // 获取定价配置
  const page = await getPricingPage();
  if (!page || !page.pricing || !page.pricing.items) {
    return {
      isValid: false,
      error: "Invalid pricing configuration"
    };
  }

  // 查找对应的定价项目
  const item = page.pricing.items.find(
    (pricingItem: PricingItem) => pricingItem.product_id === product_id
  );

  if (!item) {
    return {
      isValid: false,
      error: "Product not found"
    };
  }

  // 验证参数是否匹配
  if (
    item.amount !== amount ||
    item.interval !== interval ||
    item.currency !== currency ||
    item.credits !== credits ||
    item.valid_months !== valid_months ||
    item.product_name !== product_name
  ) {
    return {
      isValid: false,
      error: "Invalid checkout parameters - parameters do not match pricing configuration"
    };
  }

  // 验证interval类型
  if (!["year", "month", "one-time"].includes(interval)) {
    return {
      isValid: false,
      error: "Invalid interval type"
    };
  }

  // 验证valid_months与interval的匹配
  if (interval === "year" && valid_months !== 12) {
    return {
      isValid: false,
      error: "Invalid valid_months for yearly interval"
    };
  }

  if (interval === "month" && valid_months !== 1) {
    return {
      isValid: false,
      error: "Invalid valid_months for monthly interval"
    };
  }

  return {
    isValid: true,
    item
  };
}

/**
 * 获取所有可用的定价项目
 */
export async function getAllPricingItems(): Promise<PricingItem[]> {
  const page = await getPricingPage();
  return page.pricing.items;
}

/**
 * 根据interval类型获取定价项目
 */
export async function getPricingItemsByInterval(interval: "one-time" | "month" | "year"): Promise<PricingItem[]> {
  const items = await getAllPricingItems();
  return items.filter(item => item.interval === interval);
} 