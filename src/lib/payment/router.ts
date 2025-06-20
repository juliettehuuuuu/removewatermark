import { 
  PaymentProvider, 
  Currency, 
  ProductType, 
  PaymentRoutingRule,
  UserLocation 
} from "@/lib/types/payment";

// 🔥 支付路由规则配置
const PAYMENT_ROUTING_RULES: PaymentRoutingRule[] = [
  // 🇨🇳 中国用户优先使用CREEM
  {
    condition: {
      country: ["CN", "China"],
      currency: ["CNY"]
    },
    provider: "creem",
    priority: 1
  },
  
  // 🔥 订阅业务优先使用STRIPE（功能更强大）
  {
    condition: {
      productType: ["subscription"]
    },
    provider: "stripe",
    priority: 2
  },
  
  // 💰 大额支付优先使用STRIPE（更安全）
  {
    condition: {
      amount: {
        min: 10000 // $100 或 ¥100
      }
    },
    provider: "stripe",
    priority: 3
  },
  
  // 🌏 亚洲地区小额支付使用CREEM
  {
    condition: {
      country: ["JP", "KR", "SG", "HK", "TW", "MY", "TH"],
      amount: {
        max: 5000 // $50 或 ¥50
      }
    },
    provider: "creem",
    priority: 4
  },
  
  // 🌍 其他地区默认使用STRIPE
  {
    condition: {},
    provider: "stripe",
    priority: 10
  }
];

// 🔥 获取用户地理位置信息
export async function getUserLocation(ip?: string): Promise<UserLocation | null> {
  try {
    // 如果有IP地址，使用IP地理位置API
    if (ip && process.env.IPAPI_KEY) {
      const response = await fetch(
        `http://api.ipapi.com/${ip}?access_key=${process.env.IPAPI_KEY}&format=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region_name,
          city: data.city,
          timezone: data.timezone?.id || "UTC",
          currency: data.currency?.code as Currency || "USD"
        };
      }
    }
    
    // 备用方案：使用免费的IP地理位置API
    const response = await fetch(`https://ipapi.co/${ip || ""}/json/`);
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        timezone: data.timezone || "UTC",
        currency: data.currency as Currency || "USD"
      };
    }
    
    return null;
  } catch (error) {
    console.error("获取用户地理位置失败:", error);
    return null;
  }
}

// 🔥 智能支付提供商选择
export function selectPaymentProvider(params: {
  userLocation?: string;
  currency: Currency;
  productType: ProductType;
  amount: number;
  preferredProvider?: PaymentProvider;
}): PaymentProvider {
  const { userLocation, currency, productType, amount, preferredProvider } = params;
  
  // 如果用户有偏好设置，优先使用
  if (preferredProvider && isProviderAvailable(preferredProvider)) {
    return preferredProvider;
  }
  
  // 检查环境变量配置
  const enableStripe = process.env.NEXT_PUBLIC_ENABLE_STRIPE === "true";
  const enableCreem = process.env.NEXT_PUBLIC_ENABLE_CREEM === "true";
  
  if (!enableStripe && !enableCreem) {
    throw new Error("没有可用的支付提供商");
  }
  
  if (!enableStripe) return "creem";
  if (!enableCreem) return "stripe";
  
  // 应用路由规则
  const applicableRules = PAYMENT_ROUTING_RULES
    .filter(rule => matchesRule(rule, { userLocation, currency, productType, amount }))
    .sort((a, b) => a.priority - b.priority);
  
  if (applicableRules.length > 0) {
    const selectedProvider = applicableRules[0].provider;
    if (isProviderAvailable(selectedProvider)) {
      return selectedProvider;
    }
  }
  
  // 默认回退
  const defaultProvider = process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER as PaymentProvider;
  return defaultProvider && isProviderAvailable(defaultProvider) ? defaultProvider : "stripe";
}

// 🔥 检查规则是否匹配
function matchesRule(
  rule: PaymentRoutingRule, 
  params: {
    userLocation?: string;
    currency: Currency;
    productType: ProductType;
    amount: number;
  }
): boolean {
  const { condition } = rule;
  const { userLocation, currency, productType, amount } = params;
  
  // 检查国家/地区
  if (condition.country && userLocation) {
    const matches = condition.country.some(country => 
      userLocation.toLowerCase().includes(country.toLowerCase()) ||
      country.toLowerCase().includes(userLocation.toLowerCase())
    );
    if (!matches) return false;
  }
  
  // 检查货币
  if (condition.currency && !condition.currency.includes(currency)) {
    return false;
  }
  
  // 检查产品类型
  if (condition.productType && !condition.productType.includes(productType)) {
    return false;
  }
  
  // 检查金额范围
  if (condition.amount) {
    if (condition.amount.min && amount < condition.amount.min) {
      return false;
    }
    if (condition.amount.max && amount > condition.amount.max) {
      return false;
    }
  }
  
  return true;
}

// 🔥 检查支付提供商是否可用
function isProviderAvailable(provider: PaymentProvider): boolean {
  switch (provider) {
    case "stripe":
      return !!(process.env.STRIPE_PUBLIC_KEY && process.env.STRIPE_PRIVATE_KEY);
    case "creem":
      return !!(process.env.CREEM_API_KEY && process.env.CREEM_API_URL);
    default:
      return false;
  }
}

// 🔥 获取支付提供商配置
export function getPaymentConfig() {
  return {
    enableStripe: process.env.NEXT_PUBLIC_ENABLE_STRIPE === "true",
    enableCreem: process.env.NEXT_PUBLIC_ENABLE_CREEM === "true",
    defaultProvider: (process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER as PaymentProvider) || "stripe",
    autoRouting: true,
    testMode: process.env.NODE_ENV !== "production"
  };
}

// 🔥 获取货币对应的支付提供商推荐
export function getRecommendedProviderByCurrency(currency: Currency): PaymentProvider {
  const currencyProviderMap: Record<Currency, PaymentProvider> = {
    CNY: "creem",
    USD: "stripe",
    EUR: "stripe",
    GBP: "stripe",
    JPY: "stripe"
  };
  
  return currencyProviderMap[currency] || "stripe";
}

// 🔥 格式化金额（转换为最小单位）
export function formatAmountForProvider(amount: number, currency: Currency): number {
  // 大部分货币使用分为最小单位（除了日元等）
  const zeroDecimalCurrencies = ["JPY", "KRW"];
  
  if (zeroDecimalCurrencies.includes(currency)) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
}

// 🔥 从最小单位转换为标准金额
export function parseAmountFromProvider(amount: number, currency: Currency): number {
  const zeroDecimalCurrencies = ["JPY", "KRW"];
  
  if (zeroDecimalCurrencies.includes(currency)) {
    return amount;
  }
  
  return amount / 100;
} 