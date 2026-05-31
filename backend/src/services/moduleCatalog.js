const MODULE_CATALOG = [
  {
    key: 'ai_stylist_advisor',
    label: 'AI Fashion Stylist Advisor',
    description: 'Conversational styling advisor for storefront shoppers.',
  },
  {
    key: 'virtual_try_on',
    label: 'Virtual Try-On',
    description: 'Photo/live garment try-on experience for customers.',
  },
  {
    key: 'size_recommendation',
    label: 'Size Recommendation',
    description: 'Size guidance based on product and shopper context.',
  },
  {
    key: 'product_recommendations',
    label: 'Product Recommendations',
    description: 'AI-assisted product recommendation flows.',
  },
  {
    key: 'outfit_builder',
    label: 'Outfit Builder',
    description: 'Multi-item outfit composition and matching.',
  },
  {
    key: 'woocommerce_integration',
    label: 'WooCommerce Integration',
    description: 'Store connection and product sync integration.',
  },
  {
    key: 'merchant_dashboard',
    label: 'Merchant Dashboard',
    description: 'SaaS management dashboard for merchants.',
  },
  {
    key: 'storefront_widget',
    label: 'Storefront Widget',
    description: 'Embeddable storefront widget runtime.',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description: 'Performance and behavior analytics module.',
  },
  {
    key: 'billing',
    label: 'Billing and Subscription Plans',
    description: 'Subscription and plan management capabilities.',
  },
];

const MODULE_KEYS = MODULE_CATALOG.map((item) => item.key);

const PLAN_MODULE_ACCESS = {
  STARTER: {
    ai_stylist_advisor: false,
    virtual_try_on: true,
    size_recommendation: false,
    product_recommendations: false,
    outfit_builder: false,
    woocommerce_integration: true,
    merchant_dashboard: true,
    storefront_widget: true,
    analytics: true,
    billing: true,
  },
  GROWTH: {
    ai_stylist_advisor: false,
    virtual_try_on: true,
    size_recommendation: true,
    product_recommendations: true,
    outfit_builder: false,
    woocommerce_integration: true,
    merchant_dashboard: true,
    storefront_widget: true,
    analytics: true,
    billing: true,
  },
  SCALE: {
    ai_stylist_advisor: false,
    virtual_try_on: true,
    size_recommendation: true,
    product_recommendations: true,
    outfit_builder: true,
    woocommerce_integration: true,
    merchant_dashboard: true,
    storefront_widget: true,
    analytics: true,
    billing: true,
  },
};

module.exports = {
  MODULE_CATALOG,
  MODULE_KEYS,
  PLAN_MODULE_ACCESS,
};
