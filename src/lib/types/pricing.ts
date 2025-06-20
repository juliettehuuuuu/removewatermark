export interface PricingItem {
  title: string;
  description: string;
  label?: string;
  features_title: string;
  features: string[];
  interval: "one-time" | "month" | "year";
  amount: number;
  cn_amount?: number;
  currency: string;
  price: string;
  original_price?: string;
  unit: string;
  is_featured: boolean;
  tip?: string;
  button: {
    title: string;
    url: string;
    icon?: string;
  };
  product_id: string;
  product_name: string;
  credits: number;
  valid_months: number;
}

export interface PricingPage {
  pricing: {
    name: string;
    label: string;
    title: string;
    description: string;
    groups: any[];
    items: PricingItem[];
  };
}

export interface CheckoutParams {
  credits: number;
  currency: string;
  amount: number;
  interval: "one-time" | "month" | "year";
  product_id: string;
  product_name: string;
  valid_months: number;
  cancel_url?: string;
}

export interface PaymentValidationResult {
  isValid: boolean;
  error?: string;
  item?: PricingItem;
}