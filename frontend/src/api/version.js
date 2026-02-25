/**
 * 版本管理 API
 */
import request from './request'

export const versionApi = {
    /** 获取版本历史 */
    getVersions: (entityType, entityId) => request.get(`/versions/${entityType}/${entityId}`),

    /** 获取版本详情 */
    getVersionById: (id) => request.get(`/versions/detail/${id}`),

    /** 对比两个版本 */
    compareVersions: (id1, id2) => request.get(`/versions/compare/${id1}/${id2}`),
}
