const express = require('express');
const { find, findOne, insert, update, remove } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// 消费记录列表
router.get('/', (req, res) => {
  const { member_id, startDate, endDate, page = 1, pageSize = 50 } = req.query;
  let rows = find('consumptions');

  if (member_id) rows = rows.filter(r => r.member_id === Number(member_id));
  if (startDate) rows = rows.filter(r => r.record_date >= startDate);
  if (endDate) rows = rows.filter(r => r.record_date <= endDate);

  rows.sort((a, b) => b.record_date.localeCompare(a.record_date) || b.id - a.id);
  const total = rows.length;
  const totalAmount = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const pn = Number(page);
  const ps = Number(pageSize);
  const paged = rows.slice((pn - 1) * ps, pn * ps);

  res.json({ data: paged, total, totalAmount, page: pn, pageSize: ps });
});

// 新增消费记录
router.post('/', (req, res) => {
  const { member_id, member_name, item_name, amount, payment_method, record_date, notes } = req.body;
  if (!member_id || !amount || !record_date) {
    return res.status(400).json({ error: '会员、金额和日期不能为空' });
  }
  const result = insert('consumptions', {
    member_id: Number(member_id),
    member_name: member_name || '',
    item_name: item_name || '',
    amount: Number(amount),
    payment_method: payment_method || '现金',
    record_date,
    notes: notes || ''
  });

  // 更新会员消费统计
  const member = findOne('members', m => m.id === Number(member_id));
  if (member) {
    const newSpent = (member.total_spent || 0) + Number(amount);
    const newVisits = (member.visit_count || 0) + 1;
    // 如果用储值卡支付，扣减余额
    let newBalance = member.balance || 0;
    if (payment_method === '储值卡') {
      newBalance = Math.max(0, newBalance - Number(amount));
    }
    update('members', member_id, { total_spent: newSpent, visit_count: newVisits, balance: newBalance });
  }

  res.json({ id: result.id, message: '记录成功' });
});

// 更新消费记录
router.put('/:id', (req, res) => {
  const record = findOne('consumptions', c => c.id === Number(req.params.id));
  if (!record) return res.status(404).json({ error: '记录不存在' });

  const { item_name, amount, payment_method, record_date, notes } = req.body;

  // 处理金额变化：先还原旧金额的影响
  const member = findOne('members', m => m.id === record.member_id);
  if (member) {
    const oldAmount = record.amount || 0;
    const newAmount = Number(amount) || 0;
    const newSpent = (member.total_spent || 0) - oldAmount + newAmount;

    let newBalance = member.balance || 0;
    // 还原旧的储值卡扣减
    if (record.payment_method === '储值卡') newBalance += oldAmount;
    // 应用新的储值卡扣减
    if (payment_method === '储值卡') newBalance = Math.max(0, newBalance - newAmount);

    update('members', record.member_id, { total_spent: newSpent, balance: newBalance });
  }

  update('consumptions', req.params.id, {
    item_name: item_name || '', amount: Number(amount) || 0,
    payment_method: payment_method || '现金', record_date, notes: notes || ''
  });
  res.json({ message: '更新成功' });
});

// 删除消费记录
router.delete('/:id', (req, res) => {
  const record = findOne('consumptions', c => c.id === Number(req.params.id));
  if (record) {
    const member = findOne('members', m => m.id === record.member_id);
    if (member) {
      const newSpent = Math.max(0, (member.total_spent || 0) - (record.amount || 0));
      const newVisits = Math.max(0, (member.visit_count || 0) - 1);
      let newBalance = member.balance || 0;
      if (record.payment_method === '储值卡') {
        newBalance = (member.balance || 0) + (record.amount || 0);
      }
      update('members', record.member_id, { total_spent: newSpent, visit_count: newVisits, balance: newBalance });
    }
  }
  remove('consumptions', req.params.id);
  res.json({ message: '删除成功' });
});

module.exports = router;
