/**
 * 认证相关 API
 */
import request from './request'

export const authApi = {
    /** 获取登录验证码 */
    getCaptcha: () => request.get('/auth/captcha'),

    /** 用户登录 */
    login: (credentials) => request.post('/auth/login', credentials),

    /** 用户注册 */
    register: (userData) => request.post('/auth/register', userData),

    /** 用户登出 */
    logout: () => request.post('/auth/logout'),

    /** 获取当前用户信息 */
    getCurrentUser: () => request.get('/auth/me'),

    /** 修改密码 */
    changePassword: (data) => request.post('/auth/change-password', data),
}
