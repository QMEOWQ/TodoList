import React from 'react';
import { Result, Button, Typography, Card, Space } from 'antd';
import { 
  BugOutlined, 
  ReloadOutlined, 
  HomeOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import './ErrorBoundary.css';

const { Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({
      error,
      errorInfo
    });

    // 发送错误报告到监控服务
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry
    console.error('Error Boundary caught an error:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // 可以发送到后端或第三方服务
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     error: error.toString(),
    //     stack: error.stack,
    //     componentStack: errorInfo.componentStack,
    //     errorId: this.state.errorId
    //   })
    // });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <Result
              status="error"
              icon={<BugOutlined />}
              title="哎呀，出现了一些问题"
              subTitle="应用遇到了意外错误，我们正在努力修复。您可以尝试刷新页面或返回首页。"
              extra={
                <Space direction="vertical" size="middle">
                  <Space wrap>
                    <Button 
                      type="primary" 
                      icon={<ReloadOutlined />}
                      onClick={this.handleReload}
                    >
                      刷新页面
                    </Button>
                    <Button 
                      icon={<HomeOutlined />}
                      onClick={this.handleGoHome}
                    >
                      返回首页
                    </Button>
                    <Button 
                      type="dashed"
                      onClick={this.handleRetry}
                    >
                      重试
                    </Button>
                  </Space>
                  
                  {errorId && (
                    <Card size="small" className="error-id-card">
                      <Text type="secondary">
                        错误ID: <Text code>{errorId}</Text>
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        如果问题持续存在，请联系技术支持并提供此错误ID
                      </Text>
                    </Card>
                  )}
                </Space>
              }
            />

            {/* 开发环境下显示详细错误信息 */}
            {isDevelopment && error && (
              <Card 
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    开发调试信息
                  </Space>
                }
                className="error-details-card"
                size="small"
              >
                <div className="error-details">
                  <div className="error-section">
                    <Text strong>错误信息:</Text>
                    <Paragraph code className="error-message">
                      {error.toString()}
                    </Paragraph>
                  </div>

                  {error.stack && (
                    <div className="error-section">
                      <Text strong>错误堆栈:</Text>
                      <Paragraph code className="error-stack">
                        {error.stack}
                      </Paragraph>
                    </div>
                  )}

                  {errorInfo && errorInfo.componentStack && (
                    <div className="error-section">
                      <Text strong>组件堆栈:</Text>
                      <Paragraph code className="error-stack">
                        {errorInfo.componentStack}
                      </Paragraph>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 函数式组件的错误边界 Hook（用于捕获异步错误）
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('Async error caught:', error);
    
    // 可以在这里添加错误上报逻辑
    // 或者显示全局错误提示
    
    return error;
  }, []);

  return handleError;
};

// 高阶组件，用于包装可能出错的组件
export const withErrorBoundary = (Component, fallback = null) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;
