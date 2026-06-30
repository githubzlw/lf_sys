import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin } from 'antd';
import { DollarOutlined, TeamOutlined, WalletOutlined, RiseOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDashboard } from '../api';

const payColors = { '储值卡': '#722ed1', '现金': 'green', '微信支付': '#07c160', '支付宝': '#1677ff' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try { const res = await getDashboard(); setData(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading || !data) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;

  const chartOption = {
    xAxis: { type: 'category', data: data.dailyRevenue.map(d => d.date.slice(5)) },
    yAxis: { type: 'value' },
    series: [{
      data: data.dailyRevenue.map(d => d.revenue), type: 'bar',
      itemStyle: { borderRadius: [4, 4, 0, 0], color: '#722ed1' }, barMaxWidth: 20,
    }],
    grid: { left: 40, right: 20, top: 10, bottom: 30 },
    tooltip: { trigger: 'axis', formatter: (p) => `${p[0].axisValue}<br/>营收: ¥${p[0].value}` },
  };

  const recColumns = [
    { title: '日期', dataIndex: 'record_date', width: 100 },
    { title: '会员', dataIndex: 'member_name' },
    { title: '项目', dataIndex: 'item_name' },
    { title: '金额', dataIndex: 'amount', render: v => <strong>¥{v}</strong> },
    { title: '支付方式', dataIndex: 'payment_method', render: m => <Tag color={payColors[m]}>{m}</Tag> },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24, fontSize: 22 }}>数据概览</h2>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><Card><Statistic title="会员总数" value={data.members.count} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="今日营收" value={data.today.revenue} prefix={<DollarOutlined />} precision={0} suffix="元" /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="本月营收" value={data.month.revenue} prefix={<RiseOutlined />} precision={0} suffix="元" /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title="储值余额总览" value={data.members.totalBalance} prefix={<WalletOutlined />} precision={0} suffix="元" /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic title="总累计消费" value={data.members.totalSpent} suffix="元" precision={0} />
            <Statistic title="今日消费笔数" value={data.today.count} suffix="笔" style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} sm={18}>
          <Card title="近30天营收趋势">
            <ReactECharts option={chartOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>
      <Card title="最近消费记录" style={{ marginTop: 16 }}>
        <Table columns={recColumns} dataSource={data.recentRecords} rowKey="id" size="small" pagination={false} />
      </Card>
    </div>
  );
}
