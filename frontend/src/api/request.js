/**
 * Axios 请求实例封装
 * 统一处理请求拦截、响应拦截、Token 管理和错误处理
 */
import axios from 'axios'
import router from '@/router'

// 创建 Axios 实例
const request = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * 获取存储的 Token
 */
export function getToken() {
    return localStorage.getItem('accessToken')
}

/**
 * 设置 Token
 */
export function setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
}

/**
 * 清除 Token
 */
export function clearTokens() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
}

// 请求拦截器 — 自动添加 Authorization 头
request.interceptors.request.use(
    (config) => {
        const token = getToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器 — 统一错误处理
request.interceptors.response.use(
    (response) => {
        // 直接返回响应数据
        return response.data
    },
    (error) => {
        const { response } = error

        if (response) {
            // 401 未授权：清除 Token 并跳转登录页
            if (response.status === 401) {
                clearTokens()
                router.push('/login')
            }

            // 提取后端错误信息，优先展示具体的字段校验错误
            let message = response.data?.message || '请求失败'
            if (response.data?.errors && Array.isArray(response.data.errors)) {
                const details = response.data.errors.map(e => e.message).filter(Boolean)
                if (details.length > 0) {
                    message = details.join('；')
                }
            }
            console.error('API 请求错误:', message)
            return Promise.reject(new Error(message))
        }

        // 网络错误
        console.error('网络错误:', error.message)
        return Promise.reject(new Error('网络连接失败，请检查网络'))
    }
)

export default request
