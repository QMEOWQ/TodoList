import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

// 认证状态
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);
const [token, setToken] = useState("");
const [showRegister, setShowRegister] = useState(false);
const [showAdminPanel, setShowAdminPanel] = useState(false);

// 检查用户是否已登录
useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    
})

