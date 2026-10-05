const ALLOWED_ROLES = ['admin', 'customers'];

function validateUser(payload = {}) {
  const errors = [];

  if (!payload.name || typeof payload.name !== 'string' || payload.name.trim() === '') {
    errors.push('name is required');
  }

  if (!payload.email || typeof payload.email !== 'string' || !payload.email.includes('@')) {
    errors.push('a valid email is required');
  }

  if (!payload.role) {
    errors.push('role is required');
  } else if (!ALLOWED_ROLES.includes(payload.role)) {
    errors.push(`role must be one of: ${ALLOWED_ROLES.join(', ')}`);
  }

  return errors;
}

module.exports = { validateUser, ALLOWED_ROLES };
