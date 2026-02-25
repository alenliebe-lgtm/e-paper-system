/**
 * 管理者驾驶舱 API
 */
import request from './request'

export const dashboardApi = {
    /** 获取驾驶舱汇总数据 */
    getCockpitData: () => request.get('/dashboard/cockpit'),

    /** 获取项目状态分布 */
    getProjectDistribution: () => request.get('/dashboard/project-distribution'),

    /** 获取预算 vs 成本对比 */
    getBudgetVsCost: () => request.get('/dashboard/budget-vs-cost'),

    /** 获取工作流月度趋势 */
    getWorkflowTrend: () => request.get('/dashboard/workflow-trend'),
}
