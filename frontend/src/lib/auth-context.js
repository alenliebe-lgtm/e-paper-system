'use client';

/**
 * 认证上下文
 * 管理用户登录状态和权限
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, setTokens, clearTokens, getToken } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 初始化时检查登录状态
    useEffect(() => {
        const initAuth = async () => {
            const token = getToken();
            if (token) {
                try {
                    const response = await authApi.getCurrentUser();
                    setUser(response.data);
                } catch (error) {
                    console.error('获取用户信息失败:', error);
                    clearTokens();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // 登录
    const login = useCallback(async (username, password) => {
        const response = await authApi.login({ username, password });
        const { user, accessToken, refreshToken } = response.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
        return user;
    }, []);

    // 注册
    const register = useCallback(async (userData) => {
        const response = await authApi.register(userData);
        return response.data;
    }, []);

    // 登出
    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('登出失败:', error);
        } finally {
            clearTokens();
            setUser(null);
            window.location.href = '/login';
        }
    }, []);

    // 检查权限
    const hasPermission = useCallback((permission) => {
        if (!user) return false;
        if (user.role === 'Admin') return true;
        return user.permissions?.includes(permission);
    }, [user]);

    // 检查是否是指定角色
    const hasRole = useCallback((role) => {
        if (!user) return false;
        return user.role === role;
    }, [user]);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        hasPermission,
        hasRole,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth 必须在 AuthProvider 内使用');
    }
    return context;
}
