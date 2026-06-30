const express = require('express');
const { find, findOne, insert, update, remove } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// 会员列表（支持搜索、排序）
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, keyword = '', card_level = '' } = req.query;
  let rows = find('members');

  if (keyword) {
    const kw = keyword.toLowerCase();
    rows = rows.filter(r => r.name.toLowerCase().includes(kw) || (r.phone || '').includes(kw));
  }
  if (card_level) {
    rows = rows.filter(r => r.card_level === card_level);
  }

  rows.sort((a, b) => b.id - a.id);
  const total = rows.length;
  const pn = Number(page);
  const ps = Number(pageSize);
  const paged = rows.slice((pn - 1) * ps, pn * ps);

  res.json({ data: paged, total, page: pn, pageSize: ps });
});

// 单个会员详情（含消费记录）
router.get('/:id', (req, res) => {
  const member = findOne('members', m => m.id === Number(req.params.id));
  if (!member) return res.status(404).json({ error: '会员不存在' });

  const consumptions = find('consumptions', c => c.member_id === member.id)
    .sort((a, b) => b.record_date.localeCompare(a.record_date) || b.id - a.id);

  res.json({ ...member, consumptions });
});

// 新增会员
router.post('/', (req, res) => {
  const { name, phone, gender, birthday, card_level, balance, notes } = req.body;
  if (!name) return res.status(400).json({ error: '姓名不能为空' });
  const result = insert('members', {
    name, phone: phone || '', gender: gender || '', birthday: birthday || '',
    card_level: card_level || '普通会员', balance: Number(balance) || 0,
    total_spent: 0, visit_count: 0, notes: notes || ''
  });
  res.json({ id: result.id, message: '添加成功' });
});

// 更新会员
router.put('/:id', (req, res) => {
  const { name, phone, gender, birthday, card_level, balance, notes } = req.body;
  const member = findOne('members', m => m.id === Number(req.params.id));
  if (!member) return res.status(404).json({ error: '会员不存在' });
  update('members', req.params.id, {
    name, phone: phone || '', gender: gender || '', birthday: birthday || '',
    card_level: card_level || '普通会员', balance: Number(balance) || 0, notes: notes || ''
  });
  res.json({ message: '更新成功' });
});

// 删除会员
router.delete('/:id', (req, res) => {
  remove('members', req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
