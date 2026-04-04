export function requireAdminApiKey(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key || !String(key).trim()) {
    return next();
  }
  if (req.get('x-admin-key') === String(key).trim()) {
    return next();
  }
  return res.status(401).json({ message: 'Thiếu hoặc sai khóa quản trị (x-admin-key)' });
}
