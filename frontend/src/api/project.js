/**
 * 项目相关 API
 */
import request from './request'

export const projectApi = {
    /** 获取项目列表 */
    getList: (params) => request.get('/projects', { params }),

    /** 根据 ID 获取项目详情 */
    getById: (id) => request.get(`/projects/${id}`),

    /** 创建项目 */
    create: (data) => request.post('/projects', data),

    /** 更新项目 */
    update: (id, data) => request.put(`/projects/${id}`, data),

    /** 删除项目 */
    delete: (id) => request.delete(`/projects/${id}`),

    /** 获取项目统计 */
    getStats: () => request.get('/projects/stats'),

    /** 状态流转 */
    transitionStatus: (id, status) => request.patch(`/projects/${id}/transition`, { status }),
}
