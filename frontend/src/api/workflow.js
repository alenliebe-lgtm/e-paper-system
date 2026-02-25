/**
 * 工作流相关 API
 */
import request from './request'

export const workflowApi = {
    /** 获取工作流列表 */
    getList: (params) => request.get('/workflows', { params }),

    /** 根据 ID 获取工作流详情 */
    getById: (id) => request.get(`/workflows/${id}`),

    /** 创建工作流 */
    create: (data) => request.post('/workflows', data),

    /** 审批通过 */
    approve: (id, data) => request.post(`/workflows/${id}/approve`, data),

    /** 审批拒绝 */
    reject: (id, data) => request.post(`/workflows/${id}/reject`, data),

    /** 取消工作流 */
    cancel: (id) => request.post(`/workflows/${id}/cancel`),

    /** 获取待办列表 */
    getTodoList: () => request.get('/workflows/todo'),

    /** 获取工作流统计 */
    getStats: () => request.get('/workflows/stats'),
}
