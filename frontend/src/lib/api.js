/**
 * API 请求工具库
 * 封装 fetch 请求，处理认证和错误
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * 获取存储的 token
 */
function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

/**
 * 设置 token
 */
function setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}

/**
 * 清除 token
 */
function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

/**
 * 请求拦截器 - 添加认证头
 */
function createHeaders(customHeaders = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * 响应拦截器 - 处理错误
 */
async function handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        // 如果是 401 错误，尝试刷新 token 或跳转登录
        if (response.status === 401) {
            clearTokens();
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }

        throw new Error(data.message || '请求失败');
    }

    return data;
}

/**
 * 通用请求方法
 */
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        ...options,
        headers: createHeaders(options.headers),
    };

    try {
        const response = await fetch(url, config);
        return await handleResponse(response);
    } catch (error) {
        console.error('API 请求错误:', error);
        throw error;
    }
}

/**
 * GET 请求
 */
export async function get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return request(url, { method: 'GET' });
}

/**
 * POST 请求
 */
export async function post(endpoint, data = {}) {
    return request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * PUT 请求
 */
export async function put(endpoint, data = {}) {
    return request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * DELETE 请求
 */
export async function del(endpoint) {
    return request(endpoint, { method: 'DELETE' });
}

// 认证相关 API
export const authApi = {
    login: (credentials) => post('/auth/login', credentials),
    register: (userData) => post('/auth/register', userData),
    logout: () => post('/auth/logout'),
    getCurrentUser: () => get('/auth/me'),
    changePassword: (data) => post('/auth/change-password', data),
};

// 员工相关 API
export const employeeApi = {
    getList: (params) => get('/employees', params),
    getById: (id) => get(`/employees/${id}`),
    create: (data) => post('/employees', data),
    update: (id, data) => put(`/employees/${id}`, data),
    delete: (id) => del(`/employees/${id}`),
    getDepartments: () => get('/employees/departments'),
};

// 项目相关 API
export const projectApi = {
    getList: (params) => get('/projects', params),
    getById: (id) => get(`/projects/${id}`),
    create: (data) => post('/projects', data),
    update: (id, data) => put(`/projects/${id}`, data),
    delete: (id) => del(`/projects/${id}`),
    getStats: () => get('/projects/stats'),
};

// 工作流相关 API
export const workflowApi = {
    getList: (params) => get('/workflows', params),
    getById: (id) => get(`/workflows/${id}`),
    create: (data) => post('/workflows', data),
    approve: (id, data) => post(`/workflows/${id}/approve`, data),
    reject: (id, data) => post(`/workflows/${id}/reject`, data),
    cancel: (id) => post(`/workflows/${id}/cancel`),
    getTodoList: () => get('/workflows/todo'),
    getStats: () => get('/workflows/stats'),
};

// 模板相关 API
export const templateApi = {
    getList: (params) => get('/templates', params),
    getActive: (type) => get('/templates/active', { type }),
    getById: (id) => get(`/templates/${id}`),
    create: (data) => post('/templates', data),
    update: (id, data) => put(`/templates/${id}`, data),
};

export { setTokens, clearTokens, getToken };
