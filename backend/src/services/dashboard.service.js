/**
 * 管理者驾驶舱数据服务
 * 提供多维度聚合数据用于看板展示
 */

const prisma = require('../config/database');
const cacheService = require('./cache.service');
const logger = require('../utils/logger');

// 缓存 key 前缀
const CACHE_PREFIX = 'dashboard';
// 缓存过期时间（秒）
const CACHE_TTL = 300; // 5 分钟

/**
 * 获取驾驶舱汇总数据
 * @returns {Object} 汇总数据
 */
async function getCockpitData() {
    return cacheService.getOrSet(`${CACHE_PREFIX}:cockpit`, async () => {
        const [projectDist, budgetVsCost, workflowStats, alertStats] = await Promise.all([
            getProjectDistribution(),
            getBudgetVsCost(),
            getWorkflowOverview(),
            getAlertOverview(),
        ]);

        return {
            projectDistribution: projectDist,
            budgetVsCost,
            workflowStats,
            alertStats,
        };
    }, CACHE_TTL);
}

/**
 * 获取项目状态分布
 * @returns {Array} 各状态项目数量
 */
async function getProjectDistribution() {
    return cacheService.getOrSet(`${CACHE_PREFIX}:project-dist`, async () => {
        const distribution = await prisma.project.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        // 状态标签映射
        const statusLabels = {
            INIT: '立项',
            REVIEW: '审核中',
            EXECUTING: '执行中',
            CHANGE: '变更中',
            ACCEPTANCE: '验收中',
            COMPLETED: '已完成',
            SUSPENDED: '已暂停',
        };

        return distribution.map(d => ({
            status: d.status,
            label: statusLabels[d.status] || d.status,
            count: d._count.id,
        }));
    }, CACHE_TTL);
}

/**
 * 获取预算 vs 实际成本对比
 * @returns {Array} 项目预算与成本对比数据
 */
async function getBudgetVsCost() {
    return cacheService.getOrSet(`${CACHE_PREFIX}:budget-cost`, async () => {
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { budget: { not: null } },
                    { cost: { not: null } },
                ],
            },
            select: {
                id: true,
                projectName: true,
                code: true,
                budget: true,
                cost: true,
                status: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10, // 最近 10 个项目
        });

        return projects.map(p => ({
            name: p.projectName,
            code: p.code,
            budget: p.budget ? Number(p.budget) : 0,
            cost: p.cost ? Number(p.cost) : 0,
            status: p.status,
        }));
    }, CACHE_TTL);
}

/**
 * 获取月度工作流趋势（最近 6 个月）
 * @returns {Array} 月度工作流统计
 */
async function getMonthlyWorkflowTrend() {
    return cacheService.getOrSet(`${CACHE_PREFIX}:workflow-trend`, async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const workflows = await prisma.workflowInstance.findMany({
            where: {
                createdAt: { gte: sixMonthsAgo },
            },
            select: {
                createdAt: true,
                status: true,
                type: true,
            },
        });

        // 按月份聚合
        const monthlyData = {};
        workflows.forEach(w => {
            const monthKey = `${w.createdAt.getFullYear()}-${String(w.createdAt.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthKey, total: 0, approved: 0, rejected: 0, pending: 0 };
            }
            monthlyData[monthKey].total++;
            if (w.status === 'APPROVED') monthlyData[monthKey].approved++;
            else if (w.status === 'REJECTED') monthlyData[monthKey].rejected++;
            else if (w.status === 'PENDING') monthlyData[monthKey].pending++;
        });

        // 按月份排序
        return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
    }, CACHE_TTL);
}

/**
 * 获取工作流概览统计
 * @returns {Object} 工作流统计
 */
async function getWorkflowOverview() {
    const [total, pending, approved, rejected] = await Promise.all([
        prisma.workflowInstance.count(),
        prisma.workflowInstance.count({ where: { status: 'PENDING' } }),
        prisma.workflowInstance.count({ where: { status: 'APPROVED' } }),
        prisma.workflowInstance.count({ where: { status: 'REJECTED' } }),
    ]);

    // 按类型统计
    const byType = await prisma.workflowInstance.groupBy({
        by: ['type'],
        _count: { id: true },
    });

    return {
        total,
        pending,
        approved,
        rejected,
        byType: byType.map(t => ({
            type: t.type,
            count: t._count.id,
        })),
    };
}

/**
 * 获取预警概览
 * @returns {Object} 预警统计
 */
async function getAlertOverview() {
    const [total, unread] = await Promise.all([
        prisma.alert.count(),
        prisma.alert.count({ where: { isRead: false } }),
    ]);

    const byType = await prisma.alert.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { isRead: false },
    });

    return {
        total,
        unread,
        byType: byType.map(t => ({
            type: t.type,
            count: t._count.id,
        })),
    };
}

module.exports = {
    getCockpitData,
    getProjectDistribution,
    getBudgetVsCost,
    getMonthlyWorkflowTrend,
    getWorkflowOverview,
    getAlertOverview,
};
