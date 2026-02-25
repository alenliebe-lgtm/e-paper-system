/**
 * 认证状态管理 (Pinia Store)
 * 替代原 React Context 中的 AuthProvider
 * 管理用户登录状态、Token 和权限
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { setTokens, clearTokens, getToken } from '@/api/request'

export const useAuthStore = defineStore('auth', () => {
    // === State ===
    const user = ref(null)
    const loading = ref(true)

    // === Getters ===
    /** 是否已登录 */
    const isAuthenticated = computed(() => !!user.value)

    // === Actions ===

    /**
     * 初始化认证状态
     * 检查 localStorage 中是否有 Token，如果有则获取用户信息
     */
    async function initAuth() {
        const token = getToken()
        if (token) {
            try {
                const response = await authApi.getCurrentUser()
                user.value = response.data
            } catch (error) {
                console.error('获取用户信息失败:', error)
                clearTokens()
            }
        }
        loading.value = false
    }

    /**
     * 用户登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} 用户信息
     */
    async function login(username, password, captchaId, captchaCode) {
        const response = await authApi.login({ username, password, captchaId, captchaCode })
        const { user: userData, accessToken, refreshToken } = response.data
        setTokens(accessToken, refreshToken)
        user.value = userData
        return userData
    }

    /**
     * 用户注册
     * @param {Object} userData - 用户注册数据
     * @returns {Object} 注册结果
     */
    async function register(userData) {
        const response = await authApi.register(userData)
        return response.data
    }

    /**
     * 用户登出
     */
    async function logout() {
        try {
            await authApi.logout()
        } catch (error) {
            console.error('登出失败:', error)
        } finally {
            clearTokens()
            user.value = null
        }
    }

    /**
     * 检查用户是否拥有指定权限
     * @param {string} permission - 权限标识
     * @returns {boolean}
     */
    function hasPermission(permission) {
        if (!user.value) return false
        if (user.value.role === 'Admin') return true
        return user.value.permissions?.includes(permission)
    }

    /**
     * 检查用户是否是指定角色
     * @param {string} role - 角色名称
     * @returns {boolean}
     */
    function hasRole(role) {
        if (!user.value) return false
        return user.value.role === role
    }

    return {
        // State
        user,
        loading,
        // Getters
        isAuthenticated,
        // Actions
        initAuth,
        login,
        register,
        logout,
        hasPermission,
        hasRole,
    }
})
