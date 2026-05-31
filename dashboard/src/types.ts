export type Plan = 'STARTER' | 'GROWTH' | 'SCALE';
export type ClientStatus = 'trial' | 'active' | 'inactive';
export type ShopPlatform = 'woocommerce' | 'shopify' | 'custom';
export type ProductCategory = 'tops' | 'bottoms' | 'one-pieces' | 'outerwear' | 'accessories';
export type AdvisorTone = 'neutral' | 'friendly' | 'luxury';

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
  advisor?: {
    tone?: AdvisorTone;
    welcomeMessage?: string;
    maxRecommendations?: number;
  };
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
  period_start?: string;
  period_compare_start?: string;
  category_filter?: 'all' | ProductCategory;
  widget_opens: number;
  tryon_starts: number;
  completions: number;
  add_to_carts: number;
  purchases: number;
  conversion_rate: number;
  purchase_rate: number;
  tryon_completion_rate?: number;
  cart_to_purchase_rate?: number;
  average_order_value?: number;
  buyers_count: number;
  revenue: number;
  mode_split: { photo: number; live_ar: number };
  top_products: Array<{
    product_id: string;
    name: string | null;
    category?: ProductCategory | null;
    tryon_completions: number;
    add_to_carts: number;
    purchases: number;
  }>;
  category_breakdown?: Array<{
    category: ProductCategory;
    tryon_completions: number;
    add_to_carts: number;
    purchases: number;
    conversion_rate: number;
    purchase_rate?: number;
  }>;
  period_comparison?: {
    widget_opens: { current: number; previous: number; delta: number; delta_pct: number };
    tryon_starts: { current: number; previous: number; delta: number; delta_pct: number };
    completions: { current: number; previous: number; delta: number; delta_pct: number };
    add_to_carts: { current: number; previous: number; delta: number; delta_pct: number };
    purchases: { current: number; previous: number; delta: number; delta_pct: number };
    revenue: { current: number; previous: number; delta: number; delta_pct: number };
    conversion_rate: { current: number; previous: number; delta: number; delta_pct: number };
    purchase_rate: { current: number; previous: number; delta: number; delta_pct: number };
    tryon_completion_rate: { current: number; previous: number; delta: number; delta_pct: number };
    cart_to_purchase_rate: { current: number; previous: number; delta: number; delta_pct: number };
  };
  cohorts?: {
    new_customers: number;
    returning_customers: number;
    total_customers: number;
    new_share: number;
    returning_share: number;
  };
  time_to_purchase?: {
    avg_hours: number;
    median_hours: number;
    samples: number;
  };
  size_ranking?: Array<{
    size: string;
    tryon_completions: number;
    add_to_carts: number;
    purchases: number;
    conversion_rate: number;
    purchase_rate: number;
  }>;
  image_quality_breakdown?: Array<{
    bucket: string;
    started: number;
    completed: number;
    failed: number;
    completion_rate: number;
  }>;
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
