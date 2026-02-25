/**
 * 模板相关 API
 */
import request from './request'

export const templateApi = {
    /** 获取模板列表 */
    getList: (params) => request.get('/templates', { params }),

    /** 获取激活的模板 */
    getActive: (type) => request.get('/templates/active', { params: { type } }),

    /** 根据 ID 获取模板详情 */
    getById: (id) => request.get(`/templates/${id}`),

    /** 创建模板 */
    create: (data) => request.post('/templates', data),

    /** 更新模板 */
    update: (id, data) => request.put(`/templates/${id}`, data),
}
