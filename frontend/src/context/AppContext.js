import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { message } from 'antd';

// 初始状态
const initialState = {
  // 用户状态
  user: null,
  isAuthenticated: false,
  authLoading: false,
  
  // 任务状态
  todos: [],
  todosLoading: false,
  todosError: null,
  
  // UI状态
  theme: 'light',
  sidebarCollapsed: false,
  selectedTodoId: null,
  
  // 过滤和搜索状态
  filters: {
    status: 'all', // all, completed, pending
    priority: 'all', // all, high, medium, low
    category: 'all',
    searchQuery: '',
    sortBy: 'createdAt', // createdAt, updatedAt, priority, alphabetical
    sortOrder: 'desc' // asc, desc
  },
  
  // 应用设置
  settings: {
    notifications: true,
    autoSave: true,
    compactMode: false,
    showCompletedTasks: true
  }
};

// Action 类型
export const ActionTypes = {
  // 认证相关
  SET_AUTH_LOADING: 'SET_AUTH_LOADING',
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  
  // 任务相关
  SET_TODOS_LOADING: 'SET_TODOS_LOADING',
  SET_TODOS: 'SET_TODOS',
  ADD_TODO: 'ADD_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
  DELETE_TODO: 'DELETE_TODO',
  SET_TODOS_ERROR: 'SET_TODOS_ERROR',
  
  // UI相关
  TOGGLE_THEME: 'TOGGLE_THEME',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SELECTED_TODO: 'SET_SELECTED_TODO',
  
  // 过滤和搜索
  SET_FILTER: 'SET_FILTER',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SORT: 'SET_SORT',
  RESET_FILTERS: 'RESET_FILTERS',
  
  // 设置
  UPDATE_SETTINGS: 'UPDATE_SETTINGS'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_AUTH_LOADING:
      return {
        ...state,
        authLoading: action.payload
      };
      
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        authLoading: false
      };
      
    case ActionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        todos: [],
        selectedTodoId: null
      };
      
    case ActionTypes.SET_TODOS_LOADING:
      return {
        ...state,
        todosLoading: action.payload
      };
      
    case ActionTypes.SET_TODOS:
      return {
        ...state,
        todos: action.payload,
        todosLoading: false,
        todosError: null
      };
      
    case ActionTypes.ADD_TODO:
      return {
        ...state,
        todos: [action.payload, ...state.todos]
      };
      
    case ActionTypes.UPDATE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id ? action.payload : todo
        )
      };
      
    case ActionTypes.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
        selectedTodoId: state.selectedTodoId === action.payload ? null : state.selectedTodoId
      };
      
    case ActionTypes.SET_TODOS_ERROR:
      return {
        ...state,
        todosError: action.payload,
        todosLoading: false
      };
      
    case ActionTypes.TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light'
      };
      
    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      };
      
    case ActionTypes.SET_SELECTED_TODO:
      return {
        ...state,
        selectedTodoId: action.payload
      };
      
    case ActionTypes.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value
        }
      };
      
    case ActionTypes.SET_SEARCH_QUERY:
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload
        }
      };
      
    case ActionTypes.SET_SORT:
      return {
        ...state,
        filters: {
          ...state.filters,
          sortBy: action.payload.sortBy,
          sortOrder: action.payload.sortOrder
        }
      };
      
    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: {
          ...initialState.filters,
          searchQuery: state.filters.searchQuery // 保留搜索查询
        }
      };
      
    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
      
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider 组件
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 从本地存储加载设置
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      const savedSettings = localStorage.getItem('appSettings');
      
      if (savedTheme && savedTheme !== state.theme) {
        dispatch({ type: ActionTypes.TOGGLE_THEME });
      }
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings });
      }
    } catch (error) {
      console.error('加载本地设置失败:', error);
    }
  }, []);

  // 保存设置到本地存储
  useEffect(() => {
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('appSettings', JSON.stringify(state.settings));
  }, [state.theme, state.settings]);

  // Action creators
  const actions = {
    // 认证相关
    setAuthLoading: (loading) => dispatch({ type: ActionTypes.SET_AUTH_LOADING, payload: loading }),
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    logout: () => dispatch({ type: ActionTypes.LOGOUT }),
    
    // 任务相关
    setTodosLoading: (loading) => dispatch({ type: ActionTypes.SET_TODOS_LOADING, payload: loading }),
    setTodos: (todos) => dispatch({ type: ActionTypes.SET_TODOS, payload: todos }),
    addTodo: (todo) => dispatch({ type: ActionTypes.ADD_TODO, payload: todo }),
    updateTodo: (todo) => dispatch({ type: ActionTypes.UPDATE_TODO, payload: todo }),
    deleteTodo: (todoId) => dispatch({ type: ActionTypes.DELETE_TODO, payload: todoId }),
    setTodosError: (error) => dispatch({ type: ActionTypes.SET_TODOS_ERROR, payload: error }),
    
    // UI相关
    toggleTheme: () => dispatch({ type: ActionTypes.TOGGLE_THEME }),
    toggleSidebar: () => dispatch({ type: ActionTypes.TOGGLE_SIDEBAR }),
    setSelectedTodo: (todoId) => dispatch({ type: ActionTypes.SET_SELECTED_TODO, payload: todoId }),
    
    // 过滤和搜索
    setFilter: (key, value) => dispatch({ type: ActionTypes.SET_FILTER, payload: { key, value } }),
    setSearchQuery: (query) => dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: query }),
    setSort: (sortBy, sortOrder) => dispatch({ type: ActionTypes.SET_SORT, payload: { sortBy, sortOrder } }),
    resetFilters: () => dispatch({ type: ActionTypes.RESET_FILTERS }),
    
    // 设置
    updateSettings: (settings) => dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings })
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
