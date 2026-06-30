const express = require('express');
const { find } = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  const allConsumptions = find('consumptions');
  const allMembers = find('members');

  // 今日消费
  const todayRecords = allConsumptions.filter(c => c.record_date === today);
  const todayRevenue = todayRecords.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const todayCount = todayRecords.length;

  // 本月消费
  const monthRecords = allConsumptions.filter(c => c.record_date && c.record_date.startsWith(thisMonth));
  const monthRevenue = monthRecords.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  // 会员统计
  const memberCount = allMembers.length;
  const totalBalance = allMembers.reduce((s, m) => s + (Number(m.balance) || 0), 0);
  const totalSpent = allMembers.reduce((s, m) => s + (Number(m.total_spent) || 0), 0);

  // 每日营收趋势（最近30天）
  const dailyMap = {};
  const last30 = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    dailyMap[d] = 0;
    last30.push(d);
  }
  allConsumptions.forEach(c => {
    if (dailyMap[c.record_date] !== undefined) {
      dailyMap[c.record_date] += Number(c.amount) || 0;
    }
  });
  const dailyRevenue = last30.map(date => ({ date, revenue: dailyMap[date] || 0 }));

  // 最近消费记录
  const recentRecords = allConsumptions
    .sort((a, b) => b.record_date.localeCompare(a.record_date) || b.id - a.id)
    .slice(0, 10);

  res.json({
    today: { revenue: todayRevenue, count: todayCount },
    month: { revenue: monthRevenue },
    members: { count: memberCount, totalBalance, totalSpent },
    dailyRevenue,
    recentRecords
  });
});

module.exports = router;
