import { Card, Descriptions, Space, Typography } from 'antd';

export const SystemSettingsPage = (): JSX.Element => {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        System Settings
      </Typography.Title>

      <Card>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="认证方式">JWT Access Token</Descriptions.Item>
          <Descriptions.Item label="权限模型">RBAC（admin / user）</Descriptions.Item>
          <Descriptions.Item label="数据存储">内存 + 可选 OSS JSON 持久化</Descriptions.Item>
          <Descriptions.Item label="部署目标">Alibaba Cloud FC + OSS</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
};
