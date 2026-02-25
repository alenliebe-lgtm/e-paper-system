/**
 * 格式化工具函数
 * 统一日期格式化和状态映射，消除视图中的重复定义
 */

/**
 * 格式化日期为中文本地格式
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN')
}

/**
 * 格式化日期时间为中文本地格式
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date) {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
}

// ============ 状态映射表常量 ============

/** 工作流状态映射 */
export const WORKFLOW_STATUS_MAP = {
    PENDING: { label: '待处理', class: 'warning' },
    APPROVED: { label: '已通过', class: 'success' },
    REJECTED: { label: '已拒绝', class: 'error' },
    CANCELLED: { label: '已取消', class: 'info' },
}

/** 项目状态映射 */
export const PROJECT_STATUS_MAP = {
    ACTIVE: { label: '进行中', class: 'success' },
    COMPLETED: { label: '已完成', class: 'info' },
    SUSPENDED: { label: '已暂停', class: 'warning' },
}

/** 工作流 / 模板类型映射 */
export const WORKFLOW_TYPE_MAP = {
    ONBOARD: '入职',
    OFFBOARD: '离职',
}

/** 模板类型映射（含完整名称） */
export const TEMPLATE_TYPE_MAP = {
    ONBOARD: '入职流程',
    OFFBOARD: '离职流程',
}

/**
 * 根据映射表获取标签文本
 * @param {Object} map - 映射表
 * @param {string} key - 键
 * @param {string} fallback - 默认值
 * @returns {string}
 */
export function getStatusLabel(map, key, fallback = key) {
    return map[key]?.label || fallback
}

/**
 * 根据映射表获取 CSS class
 * @param {Object} map - 映射表
 * @param {string} key - 键
 * @param {string} fallback - 默认 class
 * @returns {string}
 */
export function getStatusClass(map, key, fallback = 'info') {
    return map[key]?.class || fallback
}
