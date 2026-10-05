const ALLOWED_PRIORITIES = ['low', 'medium', 'higher'];

function validateTaskCreate(payload = {}) {
  const errors = [];

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim() === '') {
    errors.push('title is required');
  }

  if (!payload.priority || !ALLOWED_PRIORITIES.includes(payload.priority)) {
    errors.push(`priority must be one of: low, medium, high`);
  }

  if (payload.assigneeId === undefined || typeof payload.assigneeId !== 'number') {
    errors.push('assigneeId is required and must be a number');
  }

  return errors;
}

function validateTaskUpdate(payload = {}) {
  const errors = [];

  if (payload.title !== undefined && (typeof payload.title !== 'string' || payload.title.trim() === '')) {
    errors.push('title must not be blank');
  }

  if (payload.priority !== undefined && !ALLOWED_PRIORITIES.includes(payload.priority)) {
    errors.push(`priority must be one of: low, medium, high`);
  }

  if (payload.completed !== undefined && typeof payload.completed !== 'boolean') {
    errors.push('completed must be a boolean');
  }

  if (payload.assigneeId !== undefined && typeof payload.assigneeId !== 'number') {
    errors.push('assigneeId must be a number');
  }

  return errors;
}

module.exports = { validateTaskCreate, validateTaskUpdate, ALLOWED_PRIORITIES };
