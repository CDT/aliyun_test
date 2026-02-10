import { DashboardOutlined, LogoutOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const { Header, Sider, Content } = Layout;

export const AdminLayout = (): JSX.Element => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = useMemo<MenuProps['items']>(() => {
    const base: MenuProps['items'] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
    ];

    if (user?.role === 'admin') {
      base.push(
        {
          key: '/users',
          icon: <TeamOutlined />,
          label: 'User Management',
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: 'System Settings',
        },
      );
    }

    return base;
  }, [user?.role]);

  const selectedKey =
    (menuItems || []).find((item) => {
      if (!item || typeof item !== 'object' || !('key' in item)) {
        return false;
      }

      const key = String(item.key);
      return location.pathname === key || location.pathname.startsWith(`${key}/`);
    })?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="brand">Admin Demo</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[String(selectedKey)]}
          items={menuItems}
          onClick={({ key }) => navigate(String(key))}
        />
      </Sider>
      <Layout>
        <Header className="header">
          <Space>
            <Typography.Text strong>{user?.username}</Typography.Text>
            <Tag color={user?.role === 'admin' ? 'red' : 'blue'}>{user?.role}</Tag>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                signOut();
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
