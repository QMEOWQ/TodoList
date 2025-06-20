import React, { useState } from 'react';
import './Login.css';

const Login = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // 登录请求
        const response = await fetch('http://localhost:8080/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          throw new Error('用户名或密码错误');
        }

        const data = await response.json();
        
        // 保存令牌和用户信息
        if (rememberMe) {
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
        if (!email.includes('@')) {
          throw new Error('请输入有效的电子邮件地址');
        }

        const response = await fetch('http://localhost:8080/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, email }),
        });

        if (response.status === 409) {
          throw new Error('用户名已存在');
        }

        if (!response.ok) {
          throw new Error('注册失败，请稍后再试');
        }

        const data = await response.json();
        
        // 保存令牌和用户信息
        if (rememberMe) {
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
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>{isLogin ? '登录' : '注册'}</h1>
        <p className="subtitle">{isLogin ? '欢迎回来！' : '创建一个新账户'}</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="form-group">
              <input
                type="email"
                placeholder="电子邮件"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="form-group">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-footer">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              记住我
            </label>
            
            {isLogin && <a href="#" className="forgot-password">忘记密码？</a>}
          </div>
          
          <button type="submit" className="login-button">
            {isLogin ? '登录' : '注册'}
          </button>
        </form>
        
        <div className="register-link">
          {isLogin ? (
            <>还没有账户？ <a href="#" onClick={toggleMode}>立即注册</a></>
          ) : (
            <>已有账户？ <a href="#" onClick={toggleMode}>立即登录</a></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;