const TOKENS = {
  'user-token': { id: 1, role: 'user' },
  'admin-token': { id: 99, role: 'admin' },
};

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const user = token ? TOKENS[token] : undefined;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
}

module.exports = { authenticate, TOKENS };
