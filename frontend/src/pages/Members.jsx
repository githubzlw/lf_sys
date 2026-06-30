import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message, Drawer, Popconfirm, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined, EditOutlined, DeleteOutlined, WalletOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getMembers, getMember, createMember, updateMember, deleteMember, getConsumptions, createConsumption, updateConsumption, deleteConsumption } from '../api';

const levelColors = { '钻石会员': '#f50', '黄金会员': '#faad14', '普通会员': '#87d068' };
const payColors = { '储值卡': '#722ed1', '现金': 'green', '微信支付': '#07c160', '支付宝': '#1677ff' };

export default function Members() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [memberModal, setMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form] = Form.useForm();

  // 详情抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memberDetail, setMemberDetail] = useState(null);
  const [consumptions, setConsumptions] = useState([]);
  const [consLoading, setConsLoading] = useState(false);

  // 消费记录弹窗
  const [consModal, setConsModal] = useState(false);
  const [editingCons, setEditingCons] = useState(null);
  const [consForm] = Form.useForm();

  useEffect(() => { loadMembers(); }, [page, keyword]);

  // ======= 会员 CRUD =======
  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await getMembers({ page, pageSize: 20, keyword });
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (e) { message.error('加载失败'); }
    finally { setLoading(false); }
  };

  const handleSaveMember = async (values) => {
    try {
      if (editingMember) {
        await updateMember(editingMember.id, values);
        message.success('会员信息已更新');
      } else {
        await createMember(values);
        message.success('会员添加成功');
      }
      setMemberModal(false); setEditingMember(null); form.resetFields();
      loadMembers();
    } catch (e) { message.error(e.response?.data?.error || '操作失败'); }
  };

  const handleDeleteMember = async (id) => {
    await deleteMember(id);
    message.success('会员已删除');
    if (drawerOpen) setDrawerOpen(false);
    loadMembers();
  };

  const openMemberDetail = async (id) => {
    try {
      setDrawerOpen(true);
      const res = await getMember(id);
      setMemberDetail(res.data);
      setConsumptions(res.data.consumptions || []);
    } catch (e) { message.error('获取详情失败'); }
  };

  // ======= 消费记录 CRUD =======
  const handleSaveConsumption = async (values) => {
    try {
      const payload = {
        ...values,
        member_id: memberDetail.id,
        member_name: memberDetail.name,
        record_date: values.record_date.format('YYYY-MM-DD'),
      };
      if (editingCons) {
        await updateConsumption(editingCons.id, payload);
        message.success('消费记录已更新');
      } else {
        await createConsumption(payload);
        message.success('消费记录已添加');
      }
      setConsModal(false); setEditingCons(null); consForm.resetFields();
      // 刷新会员详情
      const res = await getMember(memberDetail.id);
      setMemberDetail(res.data);
      setConsumptions(res.data.consumptions || []);
      loadMembers(); // 刷新列表统计
    } catch (e) { message.error(e.response?.data?.error || '操作失败'); }
  };

  const handleDeleteConsumption = async (id) => {
    await deleteConsumption(id);
    message.success('消费记录已删除');
    const res = await getMember(memberDetail.id);
    setMemberDetail(res.data);
    setConsumptions(res.data.consumptions || []);
    loadMembers();
  };

  // ======= 会员列表列 =======
  const columns = [
    {
      title: '姓名', dataIndex: 'name', key: 'name',
      render: (name, record) => <a onClick={() => openMemberDetail(record.id)}>{name}</a>,
    },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 60 },
    {
      title: '会员等级', dataIndex: 'card_level', key: 'card_level', width: 100,
      render: (l) => <Tag color={levelColors[l] || '#87d068'}>{l}</Tag>,
    },
    {
      title: '储值余额', dataIndex: 'balance', key: 'balance', width: 100,
      render: (v) => <span style={{ color: v > 0 ? '#722ed1' : '#999' }}>¥{v}</span>,
    },
    { title: '消费次数', dataIndex: 'visit_count', key: 'visits', width: 80 },
    { title: '累计消费', dataIndex: 'total_spent', key: 'spent', width: 100, render: v => <strong>¥{v}</strong> },
    { title: '加入日期', dataIndex: 'created_at', key: 'created', width: 100 },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, record) => (
        <Space>
          <a onClick={() => openMemberDetail(record.id)}><WalletOutlined /> 消费</a>
          <a onClick={() => { setEditingMember(record); form.setFieldsValue(record); setMemberModal(true); }}>
            <EditOutlined /> 编辑
          </a>
          <Popconfirm title="确定删除该会员？相关消费记录也将清空" onConfirm={() => handleDeleteMember(record.id)}>
            <a style={{ color: '#ff4d4f' }}><DeleteOutlined /></a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22 }}>会员管理</h2>
      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Input.Search placeholder="搜索姓名/电话" allowClear style={{ width: 240 }}
              prefix={<SearchOutlined />} onSearch={v => { setKeyword(v); setPage(1); }} />
            <Button icon={<ReloadOutlined />} onClick={loadMembers}>刷新</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingMember(null); form.resetFields(); setMemberModal(true);
          }}>添加会员</Button>
        </Space>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} size="middle"
          pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: t => `共 ${t} 位会员` }} />
      </Card>

      {/* ========== 会员编辑弹窗 ========== */}
      <Modal title={editingMember ? '编辑会员' : '添加会员'} open={memberModal}
        onCancel={() => { setMemberModal(false); setEditingMember(null); }}
        onOk={() => form.submit()} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSaveMember}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="会员姓名" />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="phone" label="电话"><Input placeholder="手机号" style={{ width: 200 }} /></Form.Item>
            <Form.Item name="gender" label="性别">
              <Select allowClear style={{ width: 90 }} options={[{ label: '男', value: '男' }, { label: '女', value: '女' }]} />
            </Form.Item>
          </Space>
          <Form.Item name="birthday" label="生日"><Input placeholder="如: 1990-01-01" /></Form.Item>
          <Space size={16}>
            <Form.Item name="card_level" label="会员等级">
              <Select style={{ width: 130 }} options={['钻石会员', '黄金会员', '普通会员'].map(v => ({ label: v, value: v }))} />
            </Form.Item>
            <Form.Item name="balance" label="储值余额">
              <InputNumber min={0} style={{ width: 130 }} addonBefore="¥" placeholder="0" />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* ========== 会员详情抽屉 ========== */}
      <Drawer title="会员详情" open={drawerOpen} onClose={() => setDrawerOpen(false)} width={680}>
        {memberDetail && (
          <>
            {/* 会员信息卡片 */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{memberDetail.name}
                    <Tag color={levelColors[memberDetail.card_level] || '#87d068'} style={{ marginLeft: 8 }}>
                      {memberDetail.card_level}
                    </Tag>
                  </h3>
                  <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
                    {memberDetail.phone || '无电话'} · {memberDetail.gender || '未知'} · {memberDetail.birthday || '未知生日'}
                  </div>
                  {memberDetail.notes && <div style={{ color: '#666', fontSize: 13, marginTop: 2 }}>备注：{memberDetail.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 24, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#722ed1' }}>¥{memberDetail.balance || 0}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>储值余额</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>¥{memberDetail.total_spent || 0}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>累计消费</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{memberDetail.visit_count || 0}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>消费次数</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 消费记录 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>消费记录</h4>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => {
                setEditingCons(null); consForm.resetFields();
                consForm.setFieldsValue({ record_date: dayjs(), payment_method: '储值卡' });
                setConsModal(true);
              }}>新增消费</Button>
            </div>
            <Table dataSource={consumptions} rowKey="id" size="small" pagination={false}
              columns={[
                { title: '日期', dataIndex: 'record_date', width: 100 },
                { title: '项目', dataIndex: 'item_name' },
                { title: '金额', dataIndex: 'amount', width: 90, render: v => <strong>¥{v}</strong> },
                {
                  title: '支付方式', dataIndex: 'payment_method', width: 90,
                  render: m => <Tag color={payColors[m] || '#108ee9'}>{m}</Tag>,
                },
                { title: '备注', dataIndex: 'notes', ellipsis: true },
                {
                  title: '操作', width: 120,
                  render: (_, record) => (
                    <Space size={0}>
                      <a onClick={() => {
                        setEditingCons(record);
                        consForm.setFieldsValue({ ...record, record_date: dayjs(record.record_date) });
                        setConsModal(true);
                      }}>编辑</a>
                      <Popconfirm title="确定删除？" onConfirm={() => handleDeleteConsumption(record.id)}>
                        <a style={{ color: '#ff4d4f', marginLeft: 8 }}>删除</a>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
              summary={() => {
                const total = consumptions.reduce((s, c) => s + (Number(c.amount) || 0), 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}><strong>合计</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><strong style={{ color: '#f50' }}>¥{total}</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={3} />
                  </Table.Summary.Row>
                );
              }}
            />
          </>
        )}
      </Drawer>

      {/* ========== 消费记录编辑弹窗 ========== */}
      <Modal title={editingCons ? '编辑消费记录' : '新增消费记录'} open={consModal}
        onCancel={() => { setConsModal(false); setEditingCons(null); }}
        onOk={() => consForm.submit()} width={450}>
        <Form form={consForm} layout="vertical" onFinish={handleSaveConsumption}>
          <Form.Item name="item_name" label="消费项目" rules={[{ required: true, message: '请输入消费项目' }]}>
            <Input placeholder="如: 护理套餐、清洁服务、产品购买..." />
          </Form.Item>
          <Space size={16}>
            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber min={0} style={{ width: 150 }} addonBefore="¥" placeholder="0" />
            </Form.Item>
            <Form.Item name="payment_method" label="支付方式">
              <Select style={{ width: 120 }} options={[
                { label: '储值卡', value: '储值卡' }, { label: '现金', value: '现金' },
                { label: '微信支付', value: '微信支付' }, { label: '支付宝', value: '支付宝' }
              ]} />
            </Form.Item>
          </Space>
          <Form.Item name="record_date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注"><Input placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
