/**
 * 项目服务
 * 处理项目相关的业务逻辑
 */

const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 获取项目列表（分页）
 * @param {Object} options - 查询选项
 * @returns {Object} 分页结果
 */
async function getProjects(options = {}) {
    const {
        page = 1,
        pageSize = 10,
        status,
        pmId,
        keyword,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where = {};

    if (status) {
        where.status = status;
    }

    if (pmId) {
        where.pmId = parseInt(pmId, 10);
    }

    if (keyword) {
        where.OR = [
            { projectName: { contains: keyword, mode: 'insensitive' } },
            { code: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
        ];
    }

    // 查询数据
    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { [sortBy]: sortOrder },
            include: {
                pm: {
                    select: {
                        id: true,
                        username: true,
                        profile: {
                            select: {
                                fullName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        workflows: true,
                    },
                },
            },
        }),
        prisma.project.count({ where }),
    ]);

    return {
        data: projects,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

/**
 * 获取项目详情
 * @param {number} id - 项目 ID
 * @returns {Object} 项目信息
 */
async function getProjectById(id) {
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            pm: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profile: {
                        select: {
                            fullName: true,
                            department: true,
                        },
                    },
                },
            },
            workflows: {
                select: {
                    id: true,
                    type: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 10,
            },
        },
    });

    if (!project) {
        throw new AppError('项目不存在', 404, 'PROJECT_NOT_FOUND');
    }

    return project;
}

/**
 * 创建项目
 * @param {Object} data - 项目数据
 * @returns {Object} 创建的项目
 */
async function createProject(data) {
    // 检查项目编码是否已存在
    const existingCode = await prisma.project.findUnique({
        where: { code: data.code },
    });

    if (existingCode) {
        throw new AppError('项目编码已存在', 409, 'PROJECT_CODE_EXISTS');
    }

    // 检查项目经理是否存在
    const pm = await prisma.user.findUnique({
        where: { id: data.pmId },
    });

    if (!pm) {
        throw new AppError('指定的项目经理不存在', 404, 'PM_NOT_FOUND');
    }

    const project = await prisma.project.create({
        data: {
            projectName: data.projectName,
            code: data.code,
            description: data.description,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            pmId: data.pmId,
            status: data.status || 'ACTIVE',
        },
        include: {
            pm: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    });

    return project;
}

/**
 * 更新项目
 * @param {number} id - 项目 ID
 * @param {Object} data - 更新数据
 * @returns {Object} 更新后的项目
 */
async function updateProject(id, data) {
    // 检查项目是否存在
    const existing = await prisma.project.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError('项目不存在', 404, 'PROJECT_NOT_FOUND');
    }

    // 如果更新编码，检查是否与其他项目冲突
    if (data.code && data.code !== existing.code) {
        const codeExists = await prisma.project.findFirst({
            where: {
                code: data.code,
                id: { not: id },
            },
        });

        if (codeExists) {
            throw new AppError('项目编码已存在', 409, 'PROJECT_CODE_EXISTS');
        }
    }

    // 处理日期字段
    if (data.startDate) {
        data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
        data.endDate = new Date(data.endDate);
    }

    const project = await prisma.project.update({
        where: { id },
        data,
        include: {
            pm: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    });

    return project;
}

/**
 * 删除项目
 * @param {number} id - 项目 ID
 */
async function deleteProject(id) {
    const existing = await prisma.project.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    workflows: true,
                },
            },
        },
    });

    if (!existing) {
        throw new AppError('项目不存在', 404, 'PROJECT_NOT_FOUND');
    }

    // 检查是否有关联的工作流
    if (existing._count.workflows > 0) {
        throw new AppError('项目存在关联的审批流程，无法删除', 400, 'PROJECT_HAS_WORKFLOWS');
    }

    await prisma.project.delete({
        where: { id },
    });
}

/**
 * 获取项目统计信息
 * @returns {Object} 统计数据
 */
async function getProjectStats() {
    const [total, active, completed, suspended] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: 'ACTIVE' } }),
        prisma.project.count({ where: { status: 'COMPLETED' } }),
        prisma.project.count({ where: { status: 'SUSPENDED' } }),
    ]);

    return {
        total,
        active,
        completed,
        suspended,
    };
}

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
};
