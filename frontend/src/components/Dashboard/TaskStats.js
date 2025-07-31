import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Space } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  FireOutlined
} from '@ant-design/icons';
import './TaskStats.css';

const { Title, Text } = Typography;

const TaskStats = ({ todos = [], className = '' }) => {
  // 计算统计数据
  const calculateStats = () => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.done).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // 计算今日任务
    const today = new Date().toDateString();
    const todayTasks = todos.filter(todo => 
      new Date(todo.createdAt).toDateString() === today
    );
    const todayCompleted = todayTasks.filter(todo => todo.done).length;
    
    // 计算有步骤的任务
    const tasksWithSteps = todos.filter(todo => todo.steps && todo.steps.length > 0);
    const totalSteps = tasksWithSteps.reduce((sum, todo) => sum + todo.steps.length, 0);
    const completedSteps = tasksWithSteps.reduce((sum, todo) => 
      sum + todo.steps.filter(step => step.completed).length, 0
    );
    
    // 计算连续完成天数（模拟数据）
    const streakDays = 7; // 这里应该从后端获取真实数据
    
    return {
      total,
      completed,
      pending,
      completionRate,
      todayTasks: todayTasks.length,
      todayCompleted,
      totalSteps,
      completedSteps,
      streakDays
    };
  };

  const stats = calculateStats();

  // 获取完成率的颜色
  const getProgressColor = (rate) => {
    if (rate >= 80) return '#52c41a';
    if (rate >= 60) return '#faad14';
    if (rate >= 40) return '#fa8c16';
    return '#ff4d4f';
  };

  // 获取完成率的状态
  const getProgressStatus = (rate) => {
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'normal';
    return 'exception';
  };

  return (
    <div className={`task-stats ${className}`}>
      <Row gutter={[16, 16]}>
        {/* 总体统计 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card total-tasks" hoverable>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="stat-subtitle">
              <Text type="secondary">管理您的所有任务</Text>
            </div>
          </Card>
        </Col>

        {/* 已完成任务 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card completed-tasks" hoverable>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="stat-subtitle">
              <Text type="secondary">
                完成率 {stats.completionRate}%
              </Text>
            </div>
          </Card>
        </Col>

        {/* 待完成任务 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card pending-tasks" hoverable>
            <Statistic
              title="待完成"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div className="stat-subtitle">
              <Text type="secondary">需要关注的任务</Text>
            </div>
          </Card>
        </Col>

        {/* 今日任务 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card today-tasks" hoverable>
            <Statistic
              title="今日任务"
              value={stats.todayCompleted}
              suffix={`/ ${stats.todayTasks}`}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="stat-subtitle">
              <Text type="secondary">今天的进度</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细进度和成就 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 完成率进度条 */}
        <Col xs={24} lg={12}>
          <Card className="progress-card" title="整体完成进度" hoverable>
            <div className="progress-content">
              <Progress
                type="circle"
                percent={stats.completionRate}
                strokeColor={getProgressColor(stats.completionRate)}
                status={getProgressStatus(stats.completionRate)}
                size={120}
                format={(percent) => (
                  <div className="progress-text">
                    <div className="progress-percent">{percent}%</div>
                    <div className="progress-label">完成率</div>
                  </div>
                )}
              />
              <div className="progress-details">
                <Space direction="vertical" size={4}>
                  <Text>
                    <span className="status-indicator success"></span>
                    已完成: {stats.completed} 个
                  </Text>
                  <Text>
                    <span className="status-indicator warning"></span>
                    进行中: {stats.pending} 个
                  </Text>
                  {stats.totalSteps > 0 && (
                    <Text>
                      <span className="status-indicator info"></span>
                      步骤: {stats.completedSteps}/{stats.totalSteps}
                    </Text>
                  )}
                </Space>
              </div>
            </div>
          </Card>
        </Col>

        {/* 成就和激励 */}
        <Col xs={24} lg={12}>
          <Card className="achievement-card" title="成就与激励" hoverable>
            <div className="achievement-content">
              <div className="achievement-item">
                <div className="achievement-icon">
                  <FireOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                </div>
                <div className="achievement-info">
                  <Title level={4} style={{ margin: 0 }}>
                    {stats.streakDays} 天
                  </Title>
                  <Text type="secondary">连续完成任务</Text>
                </div>
              </div>

              <div className="achievement-item">
                <div className="achievement-icon">
                  <TrophyOutlined style={{ color: '#faad14', fontSize: 24 }} />
                </div>
                <div className="achievement-info">
                  <Title level={4} style={{ margin: 0 }}>
                    {Math.floor(stats.completed / 10)}
                  </Title>
                  <Text type="secondary">完成里程碑</Text>
                </div>
              </div>

              {stats.completionRate >= 80 && (
                <div className="achievement-badge">
                  <Text strong style={{ color: '#52c41a' }}>
                    🎉 效率达人！保持这个节奏！
                  </Text>
                </div>
              )}

              {stats.pending > 5 && (
                <div className="achievement-badge warning">
                  <Text strong style={{ color: '#faad14' }}>
                    💪 任务较多，建议优先处理重要任务
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TaskStats;
