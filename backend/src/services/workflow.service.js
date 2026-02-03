/**
 * 工作流服务
 * 处理工作流相关的业务逻辑
 */

const prisma = require('../config/database');
const workflowEngine = require('./workflow.engine');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 获取工作流列表（分页）
 * @param {Object} options - 查询选项
 * @returns {Object} 分页结果
 */
async function getWorkflows(options = {}) {
    const {
        page = 1,
        pageSize = 10,
        type,
        status,
        applicantId,
        projectId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where = {};

    if (type) {
        where.type = type;
    }

    if (status) {
        where.status = status;
    }

    if (applicantId) {
        where.applicantId = parseInt(applicantId, 10);
    }

    if (projectId) {
        where.projectId = parseInt(projectId, 10);
    }

    // 查询数据
    const [workflows, total] = await Promise.all([
        prisma.workflowInstance.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { [sortBy]: sortOrder },
            include: {
                template: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                applicant: {
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
                project: {
                    select: {
                        id: true,
                        projectName: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        approvalNodes: true,
                    },
                },
            },
        }),
        prisma.workflowInstance.count({ where }),
    ]);

    return {
        data: workflows,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

/**
 * 获取工作流详情
 * @param {number} id - 工作流 ID
 * @returns {Object} 工作流信息
 */
async function getWorkflowById(id) {
    return workflowEngine.getWorkflowWithNodes(id);
}

/**
 * 创建工作流
 * @param {Object} data - 工作流数据
 * @param {number} applicantId - 申请人 ID
 * @returns {Object} 创建的工作流
 */
async function createWorkflow(data, applicantId) {
    return workflowEngine.createInstance({
        ...data,
        applicantId,
    });
}

/**
 * 审批通过
 * @param {number} id - 工作流 ID
 * @param {number} approverId - 审批人 ID
 * @param {string} comment - 审批意见
 * @returns {Object} 更新后的工作流
 */
async function approveWorkflow(id, approverId, comment) {
    return workflowEngine.approve(id, approverId, comment);
}

/**
 * 审批拒绝
 * @param {number} id - 工作流 ID
 * @param {number} approverId - 审批人 ID
 * @param {string} comment - 拒绝原因
 * @returns {Object} 更新后的工作流
 */
async function rejectWorkflow(id, approverId, comment) {
    return workflowEngine.reject(id, approverId, comment);
}

/**
 * 取消工作流
 * @param {number} id - 工作流 ID
 * @param {number} userId - 操作用户 ID
 * @returns {Object} 更新后的工作流
 */
async function cancelWorkflow(id, userId) {
    return workflowEngine.cancel(id, userId);
}

/**
 * 获取用户的待办事项
 * @param {number} userId - 用户 ID
 * @returns {Array} 待办列表
 */
async function getTodoList(userId) {
    const approvalNodes = await prisma.approvalNode.findMany({
        where: {
            approverId: userId,
            status: 'PENDING',
            workflow: {
                status: 'PENDING',
            },
        },
        include: {
            workflow: {
                include: {
                    template: {
                        select: {
                            name: true,
                        },
                    },
                    applicant: {
                        select: {
                            username: true,
                            profile: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                    project: {
                        select: {
                            projectName: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return approvalNodes.map(node => ({
        nodeId: node.id,
        workflowId: node.workflowId,
        stepOrder: node.stepOrder,
        template: node.workflow.template.name,
        type: node.workflow.type,
        applicant: node.workflow.applicant.profile?.fullName || node.workflow.applicant.username,
        project: node.workflow.project?.projectName,
        createdAt: node.createdAt,
    }));
}

/**
 * 获取工作流统计信息
 * @returns {Object} 统计数据
 */
async function getWorkflowStats() {
    const [total, pending, approved, rejected] = await Promise.all([
        prisma.workflowInstance.count(),
        prisma.workflowInstance.count({ where: { status: 'PENDING' } }),
        prisma.workflowInstance.count({ where: { status: 'APPROVED' } }),
        prisma.workflowInstance.count({ where: { status: 'REJECTED' } }),
    ]);

    return {
        total,
        pending,
        approved,
        rejected,
    };
}

module.exports = {
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    approveWorkflow,
    rejectWorkflow,
    cancelWorkflow,
    getTodoList,
    getWorkflowStats,
};
