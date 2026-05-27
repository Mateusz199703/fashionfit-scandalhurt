const { supabase } = require('./supabase');

// Returns true when the given shop belongs to the given client.
async function isShopOwnedByClient(shopId, clientId) {
  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

module.exports = { isShopOwnedByClient };
