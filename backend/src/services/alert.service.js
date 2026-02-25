/**
 * 预警服务
 * 里程碑逾期、合同到期、审批超时、库存不足预警
 */

const prisma = require('../config/database');
const { paginate } = require('../utils/pagination.helper');
const logger = require('../utils/logger');

/**
 * 创建预警
 * @param {Object} data - 预警数据
 * @returns {Object} 创建的预警
 */
async function createAlert(data) {
    const alert = await prisma.alert.create({ data });
    logger.info('AlertService', `创建预警: ${data.title} → 用户 ${data.userId}`);
    return alert;
}

/**
 * 获取用户预警列表
 * @param {number} userId - 用户 ID
 * @param {Object} query - 查询参数
 * @returns {Object} 分页结果
 */
async function getUserAlerts(userId, query = {}) {
    const { page = 1, pageSize = 20, isRead } = query;

    const where = { userId };
    if (isRead !== undefined) {
        where.isRead = isRead === 'true' || isRead === true;
    }

    return paginate('alert', {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        where,
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * 获取未读预警数量
 * @param {number} userId - 用户 ID
 * @returns {number} 未读数
 */
async function getUnreadCount(userId) {
    return prisma.alert.count({
        where: { userId, isRead: false },
    });
}

/**
 * 标记预警为已读
 * @param {number} alertId - 预警 ID
 * @param {number} userId - 用户 ID
 * @returns {Object} 更新后的预警
 */
async function markAsRead(alertId, userId) {
    return prisma.alert.updateMany({
        where: { id: alertId, userId },
        data: { isRead: true },
    });
}

/**
 * 标记所有预警为已读
 * @param {number} userId - 用户 ID
 */
async function markAllAsRead(userId) {
    await prisma.alert.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
    logger.info('AlertService', `用户 ${userId} 标记所有预警已读`);
}

/**
 * 检查里程碑逾期（定时任务调用）
 * 查找已过截止日期但未完成的里程碑，为项目经理创建预警
 */
async function checkMilestoneOverdue() {
    const now = new Date();

    // 查找逾期且未完成的里程碑
    const overdueMilestones = await prisma.milestone.findMany({
        where: {
            dueDate: { lt: now },
            completed: false,
        },
        include: {
            project: {
                include: {
                    pm: { select: { id: true } },
                },
            },
        },
    });

    let alertCount = 0;
    for (const milestone of overdueMilestones) {
        // 检查是否已经发过此里程碑的预警（避免重复）
        const existing = await prisma.alert.findFirst({
            where: {
                type: 'MILESTONE_OVERDUE',
                targetId: milestone.id,
                targetType: 'milestone',
                userId: milestone.project.pm.id,
            },
        });

        if (!existing) {
            await createAlert({
                type: 'MILESTONE_OVERDUE',
                title: '里程碑逾期提醒',
                message: `项目「${milestone.project.projectName}」的里程碑「${milestone.name}」已逾期，截止日期为 ${milestone.dueDate.toLocaleDateString('zh-CN')}`,
                targetId: milestone.id,
                targetType: 'milestone',
                userId: milestone.project.pm.id,
            });
            alertCount++;
        }
    }

    if (alertCount > 0) {
        logger.info('AlertService', `里程碑逾期检查完成，新增 ${alertCount} 条预警`);
    }
    return alertCount;
}

/**
 * 检查库存不足预警（定时任务调用）
 * 查找库存低于最低线的物料，为管理员创建预警
 */
async function checkLowStock() {
    // 查找低库存物料
    const lowStockMaterials = await prisma.$queryRaw`
        SELECT id, name, code, stock, min_stock 
        FROM materials 
        WHERE stock <= min_stock AND min_stock > 0
    `;

    // 获取管理员用户
    const admins = await prisma.user.findMany({
        where: { role: { name: 'Admin' } },
        select: { id: true },
    });

    let alertCount = 0;
    for (const material of lowStockMaterials) {
        for (const admin of admins) {
            // 检查是否已有未读的同类预警
            const existing = await prisma.alert.findFirst({
                where: {
                    type: 'LOW_STOCK',
                    targetId: material.id,
                    targetType: 'material',
                    userId: admin.id,
                    isRead: false,
                },
            });

            if (!existing) {
                await createAlert({
                    type: 'LOW_STOCK',
                    title: '库存不足预警',
                    message: `物料「${material.name}」(${material.code}) 当前库存 ${material.stock}，低于最低库存线 ${material.min_stock}`,
                    targetId: material.id,
                    targetType: 'material',
                    userId: admin.id,
                });
                alertCount++;
            }
        }
    }

    if (alertCount > 0) {
        logger.info('AlertService', `库存预警检查完成，新增 ${alertCount} 条预警`);
    }
    return alertCount;
}

module.exports = {
    createAlert,
    getUserAlerts,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    checkMilestoneOverdue,
    checkLowStock,
};
