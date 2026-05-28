export type Plan = 'STARTER' | 'GROWTH' | 'SCALE';
export type ClientStatus = 'trial' | 'active' | 'inactive';
export type ShopPlatform = 'woocommerce' | 'shopify' | 'custom';
export type ProductCategory = 'tops' | 'bottoms' | 'one-pieces' | 'outerwear' | 'accessories';

export interface Client {
  id: string;
  email: string;
  name: string;
  companyName?: string | null;
  companyNip?: string | null;
  plan: Plan;
  status: ClientStatus;
  apiKey?: string;
  trialEndsAt?: string | null;
  hasBilling?: boolean;
}

export interface WidgetConfig {
  primaryColor?: string;
  buttonLabel?: string;
  position?: 'bottom-right' | 'bottom-left';
  showLiveAR?: boolean;
  showPhotoAI?: boolean;
}

export interface Shop {
  id: string;
  client_id: string;
  name: string | null;
  domain: string;
  platform: ShopPlatform;
  widget_config: WidgetConfig;
  is_active: boolean;
  hasWooCredentials?: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  external_id: string | null;
  name: string | null;
  category: ProductCategory | null;
  garment_image_url: string | null;
  product_url: string | null;
  is_synced: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export interface AnalyticsOverview {
  period: string;
  widget_opens: number;
  tryon_starts: number;
  completions: number;
  add_to_carts: number;
  purchases: number;
  conversion_rate: number;
  purchase_rate: number;
  buyers_count: number;
  revenue: number;
  mode_split: { photo: number; live_ar: number };
  top_products: Array<{ product_id: string; name: string | null; tryon_completions: number; add_to_carts: number; purchases: number }>;
  daily_chart_data: Array<{
    date: string;
    widget_opens: number;
    tryon_starts: number;
    tryon_completions: number;
    add_to_carts: number;
    purchases: number;
    revenue: number;
  }>;
}

export interface BillingOverview {
  plan: Plan;
  status: ClientStatus;
  trialEndsAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  usage: { used: number; limit: number };
  checkoutEnabled: boolean;
  availablePlans: Record<Plan, boolean>;
  sandbox?: {
    enabled: boolean;
    shopId: string | null;
    photoTryonLimit: number;
    usedPhotoTryons: number;
    remainingPhotoTryons: number;
    exhausted: boolean;
  } | null;
}

export interface BillingStatus {
  stripeConfigured: boolean;
  webhookConfigured: boolean;
  stripeCustomerLinked: boolean;
  lastWebhookEvent: {
    event_id: string;
    event_type: string;
    status: string;
    processed_at: string | null;
    created_at: string;
    error_message: string | null;
  } | null;
}

export interface OnboardingProgress {
  step_account_created: boolean;
  step_shop_added: boolean;
  step_plugin_installed: boolean;
  step_products_synced: boolean;
  step_first_tryon: boolean;
  step_subscription_active: boolean;
  completed_at: string | null;
  completed_steps: number;
  total_steps: number;
  completion_percent: number;
  is_completed: boolean;
  table_available: boolean;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  url: string | null;
}
