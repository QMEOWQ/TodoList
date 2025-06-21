import React, { useState } from 'react';
import { Card, Form, Input, Button, Checkbox, Tabs, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import './Login.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Login = ({ onLogin, onRegister }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        // 登录请求
        const response = await fetch('http://localhost:8080/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: values.username, 
            password: values.password 
          }),
        });

        if (!response.ok) {
          throw new Error('用户名或密码错误');
        }

        const data = await response.json();
        
        // 保存令牌和用户信息
        if (values.remember) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }

        // 通知父组件登录成功
        onLogin(data.user);
      } else {
        // 注册请求
        if (!values.email.includes('@')) {
          throw new Error('请输入有效的电子邮件地址');
        }

        const response = await fetch('http://localhost:8080/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: values.username, 
            password: values.password, 
            email: values.email 
          }),
        });

        if (response.status === 409) {
          throw new Error('用户名已存在');
        }

        if (!response.ok) {
          throw new Error('注册失败，请稍后再试');
        }

        const data = await response.json();
        
        // 保存令牌和用户信息
        if (values.remember) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }

        // 通知父组件注册成功
        onRegister(data.user);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          {activeTab === 'login' ? '登录' : '注册'}
        </Title>
        
        {error && (
          <Alert 
            message={error} 
            type="error" 
            showIcon 
            style={{ marginBottom: 24 }} 
          />
        )}
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          centered
        >
          <TabPane tab="登录" key="login">
            <Form
              name="login"
              initialValues={{ remember: false }}
              onFinish={handleSubmit}
              size="large"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                />
              </Form.Item>
              
              <Form.Item>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                
                <a className="login-form-forgot" href="#" style={{ float: 'right' }}>
                  忘记密码？
                </a>
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="login-form-button" 
                  block
                  loading={loading}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane tab="注册" key="register">
            <Form
              name="register"
              initialValues={{ remember: false }}
              onFinish={handleSubmit}
              size="large"
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="用户名" 
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入电子邮件' },
                  { type: 'email', message: '请输入有效的电子邮件地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="电子邮件" 
                />
              </Form.Item>
              
              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="密码" 
                />
              </Form.Item>
              
              <Form.Item>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="login-form-button" 
                  block
                  loading={loading}
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;