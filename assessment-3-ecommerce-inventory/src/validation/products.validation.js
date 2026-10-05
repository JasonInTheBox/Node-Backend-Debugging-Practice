function validateProduct(payload = {}) {
  const errors = [];

  if (!payload.name || typeof payload.name !== 'string' || payload.name.trim() === '') {
    errors.push('name is required');
  }

  if (typeof payload.price !== 'number' || payload.price <= 0) {
    errors.push('price must be a positive number');
  }

  if (!payload.inventory) {
    errors.push('inventory is required');
  } else if (typeof payload.inventory !== 'number' || payload.inventory < 0) {
    errors.push('inventory cannot be negative');
  }

  if (!payload.category || typeof payload.category !== 'string') {
    errors.push('category is required');
  }

  if (!payload.sku || typeof payload.sku !== 'string') {
    errors.push('sku is required');
  }

  return errors;
}

module.exports = { validateProduct };
