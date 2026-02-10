import { Alert, Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../store/AuthContext';

interface LoginFormValues {
  username: string;
  password: string;
}

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { token, user, signIn } = useAuth();
  const [form] = Form.useForm<LoginFormValues>();
  const [submitting, setSubmitting] = useState(false);

  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (values: LoginFormValues): Promise<void> => {
    try {
      setSubmitting(true);
      const data = await login(values.username, values.password);
      signIn(data.accessToken, data.user);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      message.error(error?.message || '登录失败，请检查账号密码');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Card className="login-card" bordered>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Admin Demo 登录
          </Typography.Title>

          <Alert
            type="info"
            showIcon
            message="演示账号"
            description={
              <div>
                <div>admin / admin123（管理员）</div>
                <div>user / user123（普通用户）</div>
              </div>
            }
          />

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block loading={submitting}>
              登录
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
};
