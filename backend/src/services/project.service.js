/**
 * 项目服务层（重构后）
 * 使用通用分页和辅助函数消除重复代码
 */
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const { paginate } = require('../utils/pagination.helper');
const { findOrFail, parseDateFields } = require('../utils/service.helper');
const versionService = require('./version.service');
const cacheService = require('./cache.service');
const logger = require('../utils/logger');

/**
 * 项目状态流转规则（状态机）
 * 定义合法的状态转移路径
 */
const STATUS_TRANSITIONS = {
    INIT: ['REVIEW', 'SUSPENDED'],
    REVIEW: ['EXECUTING', 'SUSPENDED', 'INIT'],
    EXECUTING: ['CHANGE', 'ACCEPTANCE', 'SUSPENDED'],
    CHANGE: ['EXECUTING', 'SUSPENDED'],
    ACCEPTANCE: ['COMPLETED', 'EXECUTING'],
    COMPLETED: [],
    SUSPENDED: ['INIT', 'REVIEW', 'EXECUTING'],
};

/**
 * 获取项目列表（分页查询）
 */
async function getProjects(query) {
    const { page = 1, pageSize = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // 构建查询条件
    const where = {};
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { projectName: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
        ];
    }

    return paginate('project', {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
            pm: {
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
 * 获取项目详情
 */
async function getProjectById(id) {
    return findOrFail('project', parseInt(id, 10), {
        errorMsg: '项目不存在',
        errorCode: 'PROJECT_NOT_FOUND',
        include: {
            pm: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
            workflows: {
                select: {
                    id: true,
                    type: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
}

/**
 * 创建项目
 */
async function createProject(data) {
    // 检查项目编码唯一性
    const existing = await prisma.project.findUnique({
        where: { code: data.code },
    });

    if (existing) {
        throw new AppError('项目编码已存在', 400, 'PROJECT_CODE_EXISTS');
    }

    // 验证项目经理存在
    if (data.pmId) {
        await findOrFail('user', data.pmId, {
            errorMsg: '项目经理不存在',
            errorCode: 'PM_NOT_FOUND',
        });
    }

    const projectData = parseDateFields(data, ['startDate', 'endDate']);

    const project = await prisma.project.create({
        data: projectData,
        include: {
            pm: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
        },
    });

    logger.info('ProjectService', `创建项目: ${project.projectName} (${project.code})`);
    return project;
}

/**
 * 更新项目
 */
async function updateProject(id, data) {
    const projectId = parseInt(id, 10);

    // 检查项目存在
    const existingProject = await findOrFail('project', projectId, {
        errorMsg: '项目不存在',
        errorCode: 'PROJECT_NOT_FOUND',
    });

    // 如果修改了项目编码，检查唯一性
    if (data.code && data.code !== existingProject.code) {
        const codeConflict = await prisma.project.findUnique({
            where: { code: data.code },
        });
        if (codeConflict) {
            throw new AppError('项目编码已存在', 400, 'PROJECT_CODE_EXISTS');
        }
    }

    // 验证项目经理存在
    if (data.pmId) {
        await findOrFail('user', data.pmId, {
            errorMsg: '项目经理不存在',
            errorCode: 'PM_NOT_FOUND',
        });
    }

    const projectData = parseDateFields(data, ['startDate', 'endDate']);

    const project = await prisma.project.update({
        where: { id: projectId },
        data: projectData,
        include: {
            pm: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
        },
    });

    // 自动创建版本记录（记录每次修改的快照）
    if (data._operatorId) {
        try {
            await versionService.createVersion('project', projectId, {
                title: `项目信息更新`,
                content: {
                    projectName: project.projectName,
                    code: project.code,
                    description: project.description,
                    status: project.status,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    budget: project.budget,
                    cost: project.cost,
                },
            }, data._operatorId);
        } catch (versionError) {
            logger.warn('ProjectService', '创建版本记录失败', versionError.message);
        }
    }

    logger.info('ProjectService', `更新项目: ${project.projectName}`);
    return project;
}

/**
 * 删除项目
 */
async function deleteProject(id) {
    const projectId = parseInt(id, 10);

    // 检查项目存在
    await findOrFail('project', projectId, {
        errorMsg: '项目不存在',
        errorCode: 'PROJECT_NOT_FOUND',
    });

    // 检查是否有关联的工作流
    const workflowCount = await prisma.workflowInstance.count({
        where: { projectId },
    });

    if (workflowCount > 0) {
        throw new AppError(
            `该项目关联了 ${workflowCount} 个工作流，无法删除`,
            400,
            'PROJECT_HAS_WORKFLOWS'
        );
    }

    await prisma.project.delete({ where: { id: projectId } });

    logger.info('ProjectService', `删除项目 ID: ${projectId}`);
    return { message: '项目已删除' };
}

/**
 * 获取项目统计（扩展版）
 */
async function getProjectStats() {
    const [total, init, review, executing, change, acceptance, completed, suspended] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: 'INIT' } }),
        prisma.project.count({ where: { status: 'REVIEW' } }),
        prisma.project.count({ where: { status: 'EXECUTING' } }),
        prisma.project.count({ where: { status: 'CHANGE' } }),
        prisma.project.count({ where: { status: 'ACCEPTANCE' } }),
        prisma.project.count({ where: { status: 'COMPLETED' } }),
        prisma.project.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return { total, init, review, executing, change, acceptance, completed, suspended };
}

/**
 * 项目状态流转（状态机）
 * @param {number} projectId - 项目 ID
 * @param {string} newStatus - 目标状态
 * @param {number} operatorId - 操作人 ID
 * @returns {Object} 更新后的项目
 */
async function transitionStatus(projectId, newStatus, operatorId) {
    const id = parseInt(projectId, 10);
    const project = await findOrFail('project', id, {
        errorMsg: '项目不存在',
        errorCode: 'PROJECT_NOT_FOUND',
    });

    const allowedTargets = STATUS_TRANSITIONS[project.status];
    if (!allowedTargets || !allowedTargets.includes(newStatus)) {
        throw new AppError(
            `不允许从 "${project.status}" 转换到 "${newStatus}"`,
            400,
            'INVALID_STATUS_TRANSITION'
        );
    }

    const updated = await prisma.project.update({
        where: { id },
        data: { status: newStatus },
        include: {
            pm: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
        },
    });

    // 清理驾驶舱缓存
    await cacheService.invalidatePattern('dashboard:*');

    logger.info('ProjectService', `项目状态流转: ${project.projectName} ${project.status} → ${newStatus}`);
    return updated;
}

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
    transitionStatus,
};
