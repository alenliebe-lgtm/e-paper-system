/**
 * 预警 API
 */
import request from './request'

export const alertApi = {
    /** 获取预警列表 */
    getList: (params) => request.get('/alerts', { params }),

    /** 获取未读预警数量 */
    getUnreadCount: () => request.get('/alerts/unread-count'),

    /** 标记单条已读 */
    markAsRead: (id) => request.patch(`/alerts/${id}/read`),

    /** 标记全部已读 */
    markAllAsRead: () => request.patch('/alerts/read-all'),
}
