/**
 * 报表导出 API
 */
import request from './request'

export const exportApi = {
    /** 导出项目报告 */
    exportProjectReport: (id) => request.get(`/export/project/${id}`, {
        responseType: 'blob',
    }),

    /** 导出物料报表 */
    exportMaterialReport: (params) => request.get('/export/materials', {
        params,
        responseType: 'blob',
    }),
}

/**
 * 下载 Blob 文件
 * @param {Blob} blob - 文件 Blob
 * @param {string} filename - 文件名
 */
export function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}
