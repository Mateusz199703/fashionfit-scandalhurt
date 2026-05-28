const config = require('../config');

function isAdminEmail(email) {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  return config.adminEmails.includes(normalized);
}

module.exports = {
  isAdminEmail,
};
