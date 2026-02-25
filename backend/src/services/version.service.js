/**
 * 版本管理服务
 * 对项目方案/合同进行版本控制，记录每次修改差异
 */

const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 计算两个对象之间的差异
 * @param {Object} oldObj - 旧版本内容
 * @param {Object} newObj - 新版本内容
 * @returns {Object} 差异记录
 */
function computeDiff(oldObj, newObj) {
    const diff = { added: {}, removed: {}, changed: {} };

    // 检查新增和修改的字段
    for (const key of Object.keys(newObj)) {
        if (!(key in oldObj)) {
            diff.added[key] = newObj[key];
        } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            diff.changed[key] = {
                from: oldObj[key],
                to: newObj[key],
            };
        }
    }

    // 检查删除的字段
    for (const key of Object.keys(oldObj)) {
        if (!(key in newObj)) {
            diff.removed[key] = oldObj[key];
        }
    }

    return diff;
}

/**
 * 创建新版本
 * @param {string} entityType - 实体类型（'project' | 'contract'）
 * @param {number} entityId - 实体 ID
 * @param {Object} data - 版本数据
 * @param {string} data.title - 版本标题
 * @param {Object} data.content - 版本内容快照
 * @param {number} operatorId - 操作人 ID
 * @returns {Object} 创建的版本记录
 */
async function createVersion(entityType, entityId, data, operatorId) {
    // 获取当前最新版本号
    const latestVersion = await prisma.documentVersion.findFirst({
        where: { entityType, entityId },
        orderBy: { version: 'desc' },
        select: { version: true, content: true },
    });

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    // 计算与上一版本的差异
    let diff = null;
    if (latestVersion) {
        diff = computeDiff(latestVersion.content, data.content);
    }

    const versionRecord = await prisma.documentVersion.create({
        data: {
            entityType,
            entityId,
            version: newVersion,
            title: data.title || `版本 ${newVersion}`,
            content: data.content,
            diff,
            operatorId,
        },
        include: {
            operator: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
        },
    });

    logger.info('VersionService', `创建版本: ${entityType}#${entityId} v${newVersion}`);
    return versionRecord;
}

/**
 * 获取版本历史列表
 * @param {string} entityType - 实体类型
 * @param {number} entityId - 实体 ID
 * @returns {Array} 版本列表（按版本号降序）
 */
async function getVersions(entityType, entityId) {
    return prisma.documentVersion.findMany({
        where: { entityType, entityId: parseInt(entityId, 10) },
        orderBy: { version: 'desc' },
        include: {
            operator: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
        },
    });
}

/**
 * 获取版本详情
 * @param {number} id - 版本 ID
 * @returns {Object} 版本记录
 */
async function getVersionById(id) {
    const version = await prisma.documentVersion.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            operator: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
        },
    });

    if (!version) {
        throw new AppError('版本记录不存在', 404, 'VERSION_NOT_FOUND');
    }

    return version;
}

/**
 * 对比两个版本的差异
 * @param {number} id1 - 版本 1 ID
 * @param {number} id2 - 版本 2 ID
 * @returns {Object} 差异对比结果
 */
async function compareVersions(id1, id2) {
    const [v1, v2] = await Promise.all([
        getVersionById(id1),
        getVersionById(id2),
    ]);

    if (v1.entityType !== v2.entityType || v1.entityId !== v2.entityId) {
        throw new AppError('两个版本不属于同一实体，无法对比', 400, 'VERSION_MISMATCH');
    }

    return {
        version1: { version: v1.version, title: v1.title, createdAt: v1.createdAt },
        version2: { version: v2.version, title: v2.title, createdAt: v2.createdAt },
        diff: computeDiff(v1.content, v2.content),
    };
}

module.exports = {
    createVersion,
    getVersions,
    getVersionById,
    compareVersions,
    computeDiff,
};
