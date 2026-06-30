const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data.json');

let db = { users: [], members: [], consumptions: [] };
const counters = { users: 1, members: 1, consumptions: 1 };

function saveDB() {
  fs.writeFileSync(DB_PATH, JSON.stringify({ data: db, counters }, null, 2));
}

function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    db = raw.data;
    Object.assign(counters, raw.counters);
  }
}

function nextId(table) {
  return counters[table]++;
}

function find(table, predicate = () => true) {
  return db[table].filter(predicate);
}

function findOne(table, predicate) {
  return db[table].find(predicate);
}

function insert(table, record) {
  const id = nextId(table);
  const obj = { id, ...record, created_at: new Date().toISOString().split('T')[0] };
  db[table].push(obj);
  saveDB();
  return obj;
}

function update(table, id, fields) {
  const index = db[table].findIndex(r => r.id === Number(id));
  if (index === -1) return null;
  db[table][index] = { ...db[table][index], ...fields };
  saveDB();
  return db[table][index];
}

function remove(table, id) {
  db[table] = db[table].filter(r => r.id !== Number(id));
  saveDB();
}

function initDatabase() {
  loadDB();

  if (db.users.length === 0) {
    insert('users', { username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin' });
  }

  if (db.members.length === 0) {
    seedData();
  }
  saveDB();
}

function seedData() {
  const members = [
    { name: '张三', phone: '15900001001', gender: '男', birthday: '1990-05-15', card_level: '黄金会员', balance: 500, total_spent: 1800, visit_count: 12, notes: '老顾客' },
    { name: '李四', phone: '15900001002', gender: '女', birthday: '1992-08-20', card_level: '钻石会员', balance: 1200, total_spent: 2500, visit_count: 8, notes: '偏好美容护理' },
    { name: '王五', phone: '15900001003', gender: '男', birthday: '1988-03-10', card_level: '普通会员', balance: 100, total_spent: 300, visit_count: 3, notes: '' },
    { name: '赵六', phone: '15900001004', gender: '女', birthday: '1995-12-01', card_level: '黄金会员', balance: 0, total_spent: 800, visit_count: 5, notes: '' },
    { name: '陈七', phone: '15900001005', gender: '男', birthday: '2000-07-22', card_level: '普通会员', balance: 0, total_spent: 68, visit_count: 1, notes: '' },
    { name: '周八', phone: '15900001006', gender: '女', birthday: '1993-01-18', card_level: '钻石会员', balance: 800, total_spent: 3200, visit_count: 15, notes: 'VIP客户' },
    { name: '吴九', phone: '15900001007', gender: '男', birthday: '1985-11-05', card_level: '黄金会员', balance: 300, total_spent: 900, visit_count: 6, notes: '' },
  ];
  const insertedMembers = members.map(m => insert('members', m));
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];

  const consumptions = [
    { member_id: insertedMembers[0].id, member_name: '张三', item_name: '高级护理套餐', amount: 68, payment_method: '储值卡', record_date: today, notes: '' },
    { member_id: insertedMembers[1].id, member_name: '李四', item_name: '美白护理', amount: 398, payment_method: '储值卡', record_date: today, notes: '' },
    { member_id: insertedMembers[2].id, member_name: '王五', item_name: '基础清洁', amount: 48, payment_method: '微信支付', record_date: today, notes: '' },
    { member_id: insertedMembers[3].id, member_name: '赵六', item_name: '造型设计', amount: 368, payment_method: '支付宝', record_date: today, notes: '' },
    { member_id: insertedMembers[0].id, member_name: '张三', item_name: '补水护理', amount: 168, payment_method: '储值卡', record_date: yesterday, notes: '' },
    { member_id: insertedMembers[5].id, member_name: '周八', item_name: '高端定制服务', amount: 128, payment_method: '储值卡', record_date: yesterday, notes: '' },
    { member_id: insertedMembers[6].id, member_name: '吴九', item_name: '护理套餐', amount: 198, payment_method: '现金', record_date: yesterday, notes: '' },
    { member_id: insertedMembers[1].id, member_name: '李四', item_name: '深层清洁', amount: 128, payment_method: '储值卡', record_date: dayBefore, notes: '' },
  ];
  consumptions.forEach(c => insert('consumptions', c));
}

initDatabase();

module.exports = { find, findOne, insert, update, remove, db };
