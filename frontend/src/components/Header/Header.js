import React, { useState } from 'react';
import { 
  Layout, 
  Typography, 
  Space, 
  Button, 
  Avatar, 
  Dropdown, 
  Badge,
  Tooltip,
  Switch
} from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  SettingOutlined,
  BellOutlined,
  MoonOutlined,
  SunOutlined,
  MenuOutlined
} from '@ant-design/icons';
import './Header.css';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

const Header = ({ 
  user, 
  onLogin, 
  onLogout, 
  onToggleTheme,
  isDarkMode = false,
  notificationCount = 0,
  onToggleSidebar
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => {
        // TODO: 打开个人资料页面
        console.log('打开个人资料');
      }
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => {
        // TODO: 打开设置页面
        console.log('打开设置');
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: onLogout,
      danger: true
    }
  ];

  return (
    <AntHeader className="app-header glass-effect">
      <div className="header-content container">
        {/* 左侧：Logo和标题 */}
        <div className="header-left">
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="sidebar-toggle"
            onClick={onToggleSidebar}
          />
          <div className="logo-section">
            <div className="logo">
              <span className="logo-icon">📋</span>
            </div>
            <Title level={3} className="app-title gradient-text">
              智能待办
            </Title>
          </div>
        </div>

        {/* 右侧：用户操作区 */}
        <div className="header-right">
          <Space size="middle">
            {/* 主题切换 */}
            <Tooltip title={isDarkMode ? '切换到亮色模式' : '切换到深色模式'}>
              <Button
                type="text"
                icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
                onClick={onToggleTheme}
                className="theme-toggle"
              />
            </Tooltip>

            {user ? (
              <>
                {/* 通知铃铛 */}
                <Tooltip title="通知">
                  <Badge count={notificationCount} size="small">
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      className="notification-btn"
                    />
                  </Badge>
                </Tooltip>

                {/* 用户头像和菜单 */}
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  trigger={['click']}
                  overlayClassName="user-dropdown"
                >
                  <div className="user-profile" onClick={(e) => e.preventDefault()}>
                    <Avatar
                      size="default"
                      icon={<UserOutlined />}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <Text strong className="username">
                        {user.username}
                      </Text>
                      {user.isAdmin && (
                        <Text type="secondary" className="user-role">
                          管理员
                        </Text>
                      )}
                    </div>
                  </div>
                </Dropdown>
              </>
            ) : (
              /* 未登录状态 */
              <Space>
                <Button type="default" onClick={() => onLogin('register')}>
                  注册
                </Button>
                <Button type="primary" onClick={() => onLogin('login')}>
                  登录
                </Button>
              </Space>
            )}
          </Space>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;
