/**
 * 物料管理 API
 */
import request from './request'

export const materialApi = {
    /** 获取物料列表 */
    getList: (params) => request.get('/materials', { params }),

    /** 获取物料详情 */
    getById: (id) => request.get(`/materials/${id}`),

    /** 新建物料 */
    create: (data) => request.post('/materials', data),

    /** 更新物料 */
    update: (id, data) => request.put(`/materials/${id}`, data),

    /** 删除物料 */
    delete: (id) => request.delete(`/materials/${id}`),

    /** 出入库记录 */
    recordTransaction: (data) => request.post('/materials/transaction', data),

    /** 获取分类列表 */
    getCategories: () => request.get('/materials/categories'),

    /** 获取库存统计 */
    getStockStats: () => request.get('/materials/stats'),
}
