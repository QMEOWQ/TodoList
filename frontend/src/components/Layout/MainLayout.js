import React from 'react';
import { Layout, Typography, Space, Button, Tag } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import './MainLayout.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const MainLayout = ({ user, onLogout, children }) => {
  return (
    <Layout className="main-layout" style={{ minHeight: '100vh' }}>
      <Header className="main-header">
        <div className="header-content">
          <Title level={3} className="header-title">
            任务管理系统
          </Title>
          
          {user && (
            <Space className="user-info">
              <Text className="welcome-text">
                欢迎, {user.username}
              </Text>
              {user.isAdmin && (
                <Tag color="gold" className="admin-tag">
                  管理员
                </Tag>
              )}
              <Button 
                type="primary" 
                danger 
                icon={<LogoutOutlined />}
                onClick={onLogout}
                className="logout-btn"
              >
                登出
              </Button>
            </Space>
          )}
        </div>
      </Header>
      
      <Content className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </Content>
    </Layout>
  );
};

export default MainLayout;
