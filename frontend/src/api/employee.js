/**
 * 员工相关 API
 */
import request from './request'

export const employeeApi = {
    /** 获取员工列表 */
    getList: (params) => request.get('/employees', { params }),

    /** 根据 ID 获取员工详情 */
    getById: (id) => request.get(`/employees/${id}`),

    /** 创建员工 */
    create: (data) => request.post('/employees', data),

    /** 更新员工 */
    update: (id, data) => request.put(`/employees/${id}`, data),

    /** 删除员工 */
    delete: (id) => request.delete(`/employees/${id}`),

    /** 获取部门列表 */
    getDepartments: () => request.get('/employees/departments'),
}
