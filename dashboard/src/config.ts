export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const TOKEN_KEY = 'fashionfit_token';

export const PLANS = [
  { id: 'STARTER', name: 'Starter', price: 49, limit: 100, features: ['1 sklep', '100 przymiarek / mies.', 'Photo AI'] },
  { id: 'GROWTH', name: 'Growth', price: 149, limit: 1000, features: ['5 sklepów', '1 000 przymiarek / mies.', 'Photo AI + Live AR', 'Analityka'] },
  { id: 'SCALE', name: 'Scale', price: 399, limit: 10000, features: ['Sklepy bez limitu', '10 000 przymiarek / mies.', 'Wszystkie funkcje', 'Wsparcie priorytetowe'] },
] as const;
