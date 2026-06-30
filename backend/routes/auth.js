const express = require('express');
const bcrypt = require('bcryptjs');
const { findOne, insert } = require('../database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 登录
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const user = findOne('users', u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role }
  });
});

// 获取当前用户信息
router.get('/me', authMiddleware, (req, res) => {
  const user = findOne('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ id: user.id, username: user.username, role: user.role, created_at: user.created_at });
});

module.exports = router;
