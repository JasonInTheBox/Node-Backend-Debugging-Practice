function validateComment(payload = {}) {
  const errors = [];

  if (!payload.message || typeof payload.message !== 'string' || payload.message.trim() === '') {
    errors.push('message is required');
  }

  return errors;
}

module.exports = { validateComment };
