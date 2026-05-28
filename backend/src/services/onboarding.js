const { supabase } = require('./supabase');
const {
  isMockBackendEnabled,
  listMockShops,
  listMockProducts,
  getMockAnalyticsOverview,
  getMockClientById,
} = require('./mockStore');

const ONBOARDING_STEPS = [
  'step_account_created',
  'step_shop_added',
  'step_plugin_installed',
  'step_products_synced',
  'step_first_tryon',
  'step_subscription_active',
];

function isOnboardingTableMissing(err) {
  if (!err) return false;
  if (err.code === '42P01') return true;
  return /onboarding_progress/i.test(String(err.message || ''));
}

function emptySteps() {
  return {
    step_account_created: true,
    step_shop_added: false,
    step_plugin_installed: false,
    step_products_synced: false,
    step_first_tryon: false,
    step_subscription_active: false,
  };
}

function withProgressMeta(steps, completedAt = null) {
  const completedSteps = ONBOARDING_STEPS.filter((key) => Boolean(steps[key])).length;
  const totalSteps = ONBOARDING_STEPS.length;
  return {
    ...steps,
    completed_at: completedAt,
    completed_steps: completedSteps,
    total_steps: totalSteps,
    completion_percent: Math.round((completedSteps / totalSteps) * 100),
    is_completed: completedSteps === totalSteps,
  };
}

async function upsertOnboardingProgress(clientId, patch) {
  if (!clientId || !patch || typeof patch !== 'object') return;
  const payload = {
    client_id: clientId,
    updated_at: new Date().toISOString(),
    ...patch,
  };
  const { error } = await supabase
    .from('onboarding_progress')
    .upsert(payload, { onConflict: 'client_id' });
  if (error) throw error;
}

function markOnboardingProgressAsync(clientId, patch) {
  setImmediate(async () => {
    try {
      await upsertOnboardingProgress(clientId, patch);
    } catch (err) {
      if (!isOnboardingTableMissing(err)) {
        console.warn('onboarding progress update failed:', err.message);
      }
    }
  });
}

async function getDerivedProgressForMock(clientId) {
  const client = getMockClientById(clientId);
  const shops = listMockShops(clientId) || [];
  const shopIds = shops.map((s) => s.id);
  let syncedProducts = 0;
  let tryonCompletions = 0;

  for (const shopId of shopIds) {
    const products = listMockProducts(shopId, clientId) || [];
    syncedProducts += products.filter((p) => p && p.is_synced).length;

    const overview = getMockAnalyticsOverview(shopId, clientId, '30d');
    tryonCompletions += overview ? (overview.completions || 0) : 0;
  }

  return {
    step_shop_added: shopIds.length > 0,
    step_products_synced: syncedProducts > 0,
    step_plugin_installed: syncedProducts > 0 || tryonCompletions > 0,
    step_first_tryon: tryonCompletions > 0,
    step_subscription_active: Boolean(client && client.status === 'active'),
  };
}

async function getDerivedProgressForSupabase(clientId) {
  const [{ data: shops, error: shopsError }, { data: client, error: clientError }] = await Promise.all([
    supabase
      .from('shops')
      .select('id')
      .eq('client_id', clientId),
    supabase
      .from('clients')
      .select('status')
      .eq('id', clientId)
      .maybeSingle(),
  ]);
  if (shopsError) throw shopsError;
  if (clientError) throw clientError;

  const subscriptionActive = Boolean(client && client.status === 'active');

  const shopIds = (shops || []).map((s) => s.id);
  if (shopIds.length === 0) {
    return {
      step_shop_added: false,
      step_products_synced: false,
      step_plugin_installed: false,
      step_first_tryon: false,
      step_subscription_active: subscriptionActive,
    };
  }

  const [{ count: syncedProducts, error: productsError }, { data: events, error: eventsError }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .in('shop_id', shopIds)
      .eq('is_synced', true),
    supabase
      .from('analytics_events')
      .select('event_type')
      .in('shop_id', shopIds)
      .in('event_type', ['widget_open', 'tryon_start', 'tryon_complete', 'add_to_cart', 'purchase']),
  ]);

  if (productsError) throw productsError;
  if (eventsError) throw eventsError;

  let hasWidgetActivity = false;
  let hasTryonComplete = false;
  for (const event of events || []) {
    if (event.event_type === 'tryon_complete') hasTryonComplete = true;
    hasWidgetActivity = true;
  }

  return {
    step_shop_added: true,
    step_products_synced: (syncedProducts || 0) > 0,
    step_plugin_installed: (syncedProducts || 0) > 0 || hasWidgetActivity,
    step_first_tryon: hasTryonComplete,
    step_subscription_active: subscriptionActive,
  };
}

async function getOnboardingProgress(clientId) {
  if (isMockBackendEnabled()) {
    const steps = {
      ...emptySteps(),
      ...(await getDerivedProgressForMock(clientId)),
    };
    return {
      ...withProgressMeta(steps, null),
      table_available: false,
    };
  }

  const base = emptySteps();
  let tableRow = null;
  let tableAvailable = true;

  try {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    if (error) throw error;
    tableRow = data;
  } catch (err) {
    if (!isOnboardingTableMissing(err)) throw err;
    tableAvailable = false;
  }

  const derived = await getDerivedProgressForSupabase(clientId);

  const merged = {
    ...base,
    ...(tableRow || {}),
    ...derived,
  };
  const steps = {
    step_account_created: Boolean(merged.step_account_created),
    step_shop_added: Boolean(merged.step_shop_added),
    step_plugin_installed: Boolean(merged.step_plugin_installed),
    step_products_synced: Boolean(merged.step_products_synced),
    step_first_tryon: Boolean(merged.step_first_tryon),
    step_subscription_active: Boolean(merged.step_subscription_active),
  };

  const meta = withProgressMeta(steps, tableRow ? tableRow.completed_at : null);

  if (tableAvailable && meta.is_completed && !meta.completed_at) {
    markOnboardingProgressAsync(clientId, { completed_at: new Date().toISOString() });
  }

  return {
    ...meta,
    table_available: tableAvailable,
  };
}

module.exports = {
  isOnboardingTableMissing,
  upsertOnboardingProgress,
  markOnboardingProgressAsync,
  getOnboardingProgress,
};
