// Usage: router.patch('/complaints/:id/status', protect, checkRole(['supervisor', 'admin']), updateStatus);
const checkRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "You don't have access to do that." });
  }
  next();
};

module.exports = checkRole;