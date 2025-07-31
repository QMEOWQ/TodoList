import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Checkbox, Tabs, Typography, Alert, Space, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
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

  // 验证码相关状态
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  // 倒计时效果
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 发送验证码
  const sendVerificationCode = async (email) => {
    if (!email || !email.includes('@')) {
      message.error('请输入有效的邮箱地址');
      return;
    }

    setSendingCode(true);
    try {
      const response = await fetch('http://localhost:8080/api/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          purpose: 'registration'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '发送验证码失败');
      }

      const data = await response.json();
      message.success('验证码已发送到您的邮箱');
      setCodeSent(true);
      setCountdown(60); // 60秒倒计时
    } catch (error) {
      console.error('发送验证码失败:', error);
      message.error(error.message || '发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        // 登录请求
        const response = await fetch('http://localhost:8080/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username: values.username,
            password: values.password
          }),
        });

        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('服务器返回非JSON响应:', text);
          throw new Error('服务器连接失败，请检查后端服务是否正常运行');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '用户名或密码错误');
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
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            username: values.username,
            password: values.password,
            email: values.email,
            verificationCode: values.verificationCode || ''
          }),
        });

        // 检查响应类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('服务器返回非JSON响应:', text);
          throw new Error('服务器连接失败，请检查后端服务是否正常运行');
        }

        if (response.status === 409) {
          const errorData = await response.json();
          throw new Error(errorData.message || '用户名已存在');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '注册失败，请稍后再试');
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
      console.error('登录/注册错误:', error);

      // 处理网络错误
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('网络连接失败，请检查网络连接或后端服务是否正常运行');
      } else if (error.message.includes('Failed to fetch')) {
        setError('无法连接到服务器，请检查后端服务是否正常运行在 http://localhost:8080');
      } else {
        setError(error.message || '操作失败，请稍后再试');
      }
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
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Item>

              <Form.Item>
                <Space.Compact style={{ display: 'flex', width: '100%' }}>
                  <Form.Item
                    name="verificationCode"
                    rules={[{ required: true, message: '请输入验证码' }]}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <Input
                      prefix={<SafetyOutlined />}
                      placeholder="邮箱验证码"
                    />
                  </Form.Item>
                  <Button
                    type="default"
                    onClick={() => sendVerificationCode(email)}
                    loading={sendingCode}
                    disabled={countdown > 0 || !email || !email.includes('@')}
                    style={{ marginLeft: 8 }}
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </Button>
                </Space.Compact>
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