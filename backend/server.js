const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const consumptionRoutes = require('./routes/consumptions');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/consumptions', consumptionRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, () => {
  console.log(`会员管理系统 API 运行在 http://localhost:${PORT}`);
});
