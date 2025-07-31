import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Input, 
  Select, 
  Space, 
  Button, 
  Tag, 
  Dropdown,
  Badge,
  Tooltip,
  Row,
  Col
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  SortAscendingOutlined,
  SortDescendingOutlined,
  ClearOutlined,
  CalendarOutlined,
  FlagOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';
import './TaskFilter.css';

const { Option } = Select;

const TaskFilter = ({ className = '' }) => {
  const { state, actions } = useAppContext();
  const { filters } = state;
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // 计算活跃过滤器数量
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  // 处理搜索
  const handleSearch = (value) => {
    actions.setSearchQuery(value);
  };

  // 处理过滤器变化
  const handleFilterChange = (key, value) => {
    actions.setFilter(key, value);
  };

  // 处理排序变化
  const handleSortChange = (sortBy) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    actions.setSort(sortBy, newOrder);
  };

  // 重置所有过滤器
  const handleResetFilters = () => {
    actions.resetFilters();
  };

  // 排序选项
  const sortOptions = [
    { key: 'createdAt', label: '创建时间', icon: <CalendarOutlined /> },
    { key: 'updatedAt', label: '更新时间', icon: <CalendarOutlined /> },
    { key: 'priority', label: '优先级', icon: <FlagOutlined /> },
    { key: 'alphabetical', label: '字母顺序', icon: <TagOutlined /> }
  ];

  // 过滤器下拉菜单
  const filterDropdownItems = [
    {
      key: 'status',
      label: (
        <div className="filter-item">
          <span className="filter-label">状态</span>
          <Select
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            style={{ width: 120 }}
            size="small"
          >
            <Option value="all">全部</Option>
            <Option value="pending">待完成</Option>
            <Option value="completed">已完成</Option>
          </Select>
        </div>
      )
    },
    {
      key: 'priority',
      label: (
        <div className="filter-item">
          <span className="filter-label">优先级</span>
          <Select
            value={filters.priority}
            onChange={(value) => handleFilterChange('priority', value)}
            style={{ width: 120 }}
            size="small"
          >
            <Option value="all">全部</Option>
            <Option value="high">高</Option>
            <Option value="medium">中</Option>
            <Option value="low">低</Option>
          </Select>
        </div>
      )
    },
    {
      key: 'category',
      label: (
        <div className="filter-item">
          <span className="filter-label">分类</span>
          <Select
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            style={{ width: 120 }}
            size="small"
          >
            <Option value="all">全部</Option>
            <Option value="work">工作</Option>
            <Option value="personal">个人</Option>
            <Option value="study">学习</Option>
            <Option value="health">健康</Option>
          </Select>
        </div>
      )
    },
    {
      type: 'divider'
    },
    {
      key: 'reset',
      label: (
        <Button 
          type="text" 
          icon={<ClearOutlined />}
          onClick={handleResetFilters}
          disabled={activeFiltersCount === 0}
          block
        >
          重置过滤器
        </Button>
      )
    }
  ];

  return (
    <Card className={`task-filter ${className}`} size="small">
      <Row gutter={[16, 16]} align="middle">
        {/* 搜索框 */}
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="搜索任务..."
            prefix={<SearchOutlined />}
            value={filters.searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            size="middle"
            className="search-input"
          />
        </Col>

        {/* 过滤器和排序 */}
        <Col xs={24} sm={12} md={16}>
          <div className="filter-actions">
            <Space wrap>
              {/* 过滤器按钮 */}
              <Dropdown
                menu={{ items: filterDropdownItems }}
                trigger={['click']}
                placement="bottomLeft"
                overlayClassName="filter-dropdown"
              >
                <Button 
                  icon={<FilterOutlined />}
                  className="filter-button"
                >
                  过滤器
                  {activeFiltersCount > 0 && (
                    <Badge 
                      count={activeFiltersCount} 
                      size="small" 
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </Button>
              </Dropdown>

              {/* 排序按钮 */}
              <Dropdown
                menu={{
                  items: sortOptions.map(option => ({
                    key: option.key,
                    label: (
                      <div className="sort-item">
                        {option.icon}
                        <span>{option.label}</span>
                        {filters.sortBy === option.key && (
                          filters.sortOrder === 'desc' ? 
                            <SortDescendingOutlined /> : 
                            <SortAscendingOutlined />
                        )}
                      </div>
                    ),
                    onClick: () => handleSortChange(option.key)
                  }))
                }}
                trigger={['click']}
                placement="bottomLeft"
                overlayClassName="sort-dropdown"
              >
                <Button 
                  icon={filters.sortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                  className="sort-button"
                >
                  排序
                </Button>
              </Dropdown>

              {/* 重置按钮 */}
              {activeFiltersCount > 0 && (
                <Tooltip title="清除所有过滤器">
                  <Button 
                    type="text"
                    icon={<ClearOutlined />}
                    onClick={handleResetFilters}
                    className="reset-button"
                  >
                    重置
                  </Button>
                </Tooltip>
              )}
            </Space>
          </div>
        </Col>
      </Row>

      {/* 活跃过滤器标签 */}
      {activeFiltersCount > 0 && (
        <div className="active-filters">
          <Space wrap size={[8, 8]}>
            <span className="active-filters-label">当前过滤:</span>
            
            {filters.status !== 'all' && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('status', 'all')}
                color="blue"
              >
                状态: {filters.status === 'pending' ? '待完成' : '已完成'}
              </Tag>
            )}
            
            {filters.priority !== 'all' && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('priority', 'all')}
                color="orange"
              >
                优先级: {filters.priority === 'high' ? '高' : filters.priority === 'medium' ? '中' : '低'}
              </Tag>
            )}
            
            {filters.category !== 'all' && (
              <Tag 
                closable 
                onClose={() => handleFilterChange('category', 'all')}
                color="green"
              >
                分类: {filters.category}
              </Tag>
            )}
            
            {filters.searchQuery && (
              <Tag 
                closable 
                onClose={() => handleSearch('')}
                color="purple"
              >
                搜索: "{filters.searchQuery}"
              </Tag>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default TaskFilter;
