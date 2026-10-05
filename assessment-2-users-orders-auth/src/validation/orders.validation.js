const ALLOWED_STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];

function validateOrder(payload = {}) {
  const errors = [];

  if (payload.userId === undefined || typeof payload.userId !== 'number') {
    errors.push('userId is required and must be a number');
  }

  if (!payload.product || typeof payload.product !== 'string' || payload.product.trim() === '') {
    errors.push('product is required');
  }

  if (typeof payload.quantity !== 'number' || payload.quantity <= 0) {
    errors.push('quantity must be a positive number');
  }

  if (payload.status !== undefined && !ALLOWED_STATUSES.includes(payload.status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }

  return errors;
}

module.exports = { validateOrder, ALLOWED_STATUSES };
