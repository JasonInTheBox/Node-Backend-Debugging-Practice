function validateOrder(payload = {}) {
  const errors = [];

  if (typeof payload.productId !== 'number' || Number.isNaN(payload.productId)) {
    errors.push('productId is required and must be a number');
  }

  if (typeof payload.quantity !== 'number' || payload.quantity <= 0) {
    errors.push('quantity must be a positive number');
  }

  return errors;
}

module.exports = { validateOrder };
