import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import './Login.css';

const { TabPane } = Tabs;

const Login = ({ onLogin, onRegister }) => {
  const [loading, setLoading] = useState(false);

  const handleAuth = async (values, endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `An error occurred during ${endpoint}.`);
      }

      message.success(data.message || '操作成功');

      const { token, user } = data;

      if (endpoint === 'login') {
        if (values.remember) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
        }
        onLogin(user);
      } else { // registration
        if (token && user) {
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
            onRegister(user);
        }
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const onFinishLogin = (values) => {
    handleAuth(values, 'login');
  };

  const onFinishRegister = (values) => {
    handleAuth(values, 'register');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <Tabs defaultActiveKey="1" centered>
          <TabPane tab="登录" key="1">
            <Form
              name="normal_login"
              className="login-form"
              initialValues={{ remember: true }}
              onFinish={onFinishLogin}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  type="password"
                  placeholder="密码"
                />
              </Form.Item>
              <Form.Item>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <a className="login-form-forgot" href="">
                  忘记密码
                </a>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" loading={loading} block>
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab="注册" key="2">
            <Form
              name="register"
              className="login-form"
              onFinish={onFinishRegister}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="用户名" />
              </Form.Item>
               <Form.Item
                name="email"
                rules={[{ required: true, message: '请输入邮箱!', type: 'email' }]}
              >
                <Input prefix={<MailOutlined className="site-form-item-icon" />} placeholder="邮箱" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                  type="password"
                  placeholder="密码"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" loading={loading} block>
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default Login; 