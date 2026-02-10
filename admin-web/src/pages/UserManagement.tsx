import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { createUser, deleteUser, getUsers, updateUser } from '../api/users';
import { Role, UserProfile } from '../types';

interface UserFormValues {
  username: string;
  password?: string;
  role: Role;
}

export const UserManagementPage = (): JSX.Element => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm<UserFormValues>();

  const loadUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error: any) {
      message.error(error?.message || '加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const openCreateModal = (): void => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'user',
    });
    setVisible(true);
  };

  const openEditModal = (user: UserProfile): void => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      role: user.role,
      password: '',
    });
    setVisible(true);
  };

  const closeModal = (): void => {
    setVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingUser) {
        const payload: {
          username?: string;
          password?: string;
          role?: Role;
        } = {
          username: values.username,
          role: values.role,
        };

        if (values.password && values.password.trim()) {
          payload.password = values.password;
        }

        await updateUser(editingUser.id, payload);
        message.success('用户更新成功');
      } else {
        await createUser({
          username: values.username,
          password: values.password || '',
          role: values.role,
        });
        message.success('用户创建成功');
      }

      closeModal();
      await loadUsers();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      message.error(error?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string): Promise<void> => {
    try {
      await deleteUser(userId);
      message.success('用户删除成功');
      await loadUsers();
    } catch (error: any) {
      message.error(error?.message || '删除失败');
    }
  };

  const columns: ColumnsType<UserProfile> = [
    {
      title: '用户名',
      dataIndex: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: Role) => <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该用户？"
            okText="删除"
            cancelText="取消"
            onConfirm={() => void handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          User Management
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          新增用户
        </Button>
      </Space>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={users} loading={loading} />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={visible}
        onCancel={closeModal}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={editingUser ? '密码（留空不修改）' : '密码'}
            name="password"
            rules={
              editingUser
                ? [
                    {
                      validator: (_, value: string | undefined) => {
                        if (!value) {
                          return Promise.resolve();
                        }

                        if (value.length < 6) {
                          return Promise.reject(new Error('密码至少 6 位'));
                        }

                        return Promise.resolve();
                      },
                    },
                  ]
                : [
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码至少 6 位' },
                  ]
            }
          >
            <Input.Password />
          </Form.Item>

          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={[
                { value: 'admin', label: 'admin' },
                { value: 'user', label: 'user' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};
