const TOKENS = {
  'admin-token-123': { userId: 1, name: 'Alice Johnson', role: 'admin' },
  'customer-token-456': { userId: 2, name: 'Bob Smith', role: 'customer' },
};

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = token ? TOKENS[token] : undefined;

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role === 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

module.exports = { authenticate, requireAdmin, TOKENS };
