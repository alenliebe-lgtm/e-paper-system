/**
 * 管理者驾驶舱控制器
 */

const dashboardService = require('../services/dashboard.service');

// 获取驾驶舱汇总数据
const getCockpitData = async (req, res, next) => {
    try {
        const data = await dashboardService.getCockpitData();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 获取项目状态分布
const getProjectDistribution = async (req, res, next) => {
    try {
        const data = await dashboardService.getProjectDistribution();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 获取预算 vs 成本对比
const getBudgetVsCost = async (req, res, next) => {
    try {
        const data = await dashboardService.getBudgetVsCost();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 获取月度工作流趋势
const getWorkflowTrend = async (req, res, next) => {
    try {
        const data = await dashboardService.getMonthlyWorkflowTrend();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCockpitData,
    getProjectDistribution,
    getBudgetVsCost,
    getWorkflowTrend,
};
