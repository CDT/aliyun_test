import { Card, Col, Row, Space, Statistic, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { useAuth } from '../store/AuthContext';

interface MetricRow {
  key: string;
  module: string;
  status: string;
  owner: string;
  updatedAt: string;
}

const tableData: MetricRow[] = [
  {
    key: '1',
    module: 'Order Service',
    status: 'Healthy',
    owner: 'Team A',
    updatedAt: '2026-02-10 09:30',
  },
  {
    key: '2',
    module: 'User Service',
    status: 'Warning',
    owner: 'Team B',
    updatedAt: '2026-02-10 09:15',
  },
  {
    key: '3',
    module: 'Payment Service',
    status: 'Healthy',
    owner: 'Team C',
    updatedAt: '2026-02-10 08:55',
  },
];

const columns: ColumnsType<MetricRow> = [
  {
    title: '模块',
    dataIndex: 'module',
  },
  {
    title: '状态',
    dataIndex: 'status',
  },
  {
    title: '负责人',
    dataIndex: 'owner',
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
  },
];

export const DashboardPage = (): JSX.Element => {
  const { user } = useAuth();

  const stats = useMemo(() => {
    return [
      {
        title: '今日访问量',
        value: 3281,
      },
      {
        title: '活跃会话',
        value: user?.role === 'admin' ? 128 : 45,
      },
      {
        title: '错误告警',
        value: 2,
      },
    ];
  }, [user?.role]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        Dashboard
      </Typography.Title>

      <Row gutter={[16, 16]}>
        {stats.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.title}>
            <Card>
              <Statistic title={item.title} value={item.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="系统模块状态">
        <Table rowKey="key" columns={columns} dataSource={tableData} pagination={false} />
      </Card>
    </Space>
  );
};
