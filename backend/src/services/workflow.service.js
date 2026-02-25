/**
 * 工作流服务层（重构后）
 * 使用通用辅助函数消除重复代码
 */
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const workflowEngine = require('./workflow.engine');
const { paginate } = require('../utils/pagination.helper');
const { findOrFail } = require('../utils/service.helper');
const logger = require('../utils/logger');

/**
 * 获取工作流列表（分页查询）
 */
async function getWorkflows(query) {
    const { page = 1, pageSize = 10, type, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // 构建查询条件
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;

    return paginate('workflowInstance', {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
            template: { select: { id: true, name: true, type: true } },
            applicant: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
            project: { select: { id: true, projectName: true, code: true } },
        },
    });
}

/**
 * 获取工作流详情
 */
async function getWorkflowById(id) {
    const workflowId = parseInt(id, 10);

    const workflow = await prisma.workflowInstance.findUnique({
        where: { id: workflowId },
        include: {
            template: true,
            applicant: {
                select: {
                    id: true,
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
            project: { select: { id: true, projectName: true, code: true } },
            approvalNodes: {
                orderBy: { stepOrder: 'asc' },
                include: {
                    approver: {
                        select: {
                            id: true,
                            username: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                },
            },
        },
    });

    if (!workflow) {
        throw new AppError('工作流不存在', 404, 'WORKFLOW_NOT_FOUND');
    }

    return workflow;
}

/**
 * 创建工作流
 */
async function createWorkflow(data, userId) {
    const { templateId, type, projectId, remark } = data;

    // 验证模板存在且处于活跃状态
    const template = await findOrFail('template', templateId, {
        errorMsg: '模板不存在',
        errorCode: 'TEMPLATE_NOT_FOUND',
    });

    if (!template.isActive) {
        throw new AppError('该模板已停用', 400, 'TEMPLATE_INACTIVE');
    }

    // 验证项目存在（如果指定了项目）
    if (projectId) {
        await findOrFail('project', projectId, {
            errorMsg: '项目不存在',
            errorCode: 'PROJECT_NOT_FOUND',
        });
    }

    const workflow = await workflowEngine.createWorkflow({
        templateId,
        type: type || template.type,
        applicantId: userId,
        projectId,
        remark,
    });

    logger.info('WorkflowService', `创建工作流: 模板 ${template.name}, 申请人 ID: ${userId}`);
    return workflow;
}

/**
 * 审批通过
 */
async function approveWorkflow(id, userId, data) {
    const workflowId = parseInt(id, 10);
    const result = await workflowEngine.processApproval(workflowId, userId, 'APPROVED', data?.comment);
    logger.info('WorkflowService', `审批通过: 工作流 ID ${workflowId}, 审批人 ID: ${userId}`);
    return result;
}

/**
 * 审批拒绝
 */
async function rejectWorkflow(id, userId, data) {
    const workflowId = parseInt(id, 10);
    const result = await workflowEngine.processApproval(workflowId, userId, 'REJECTED', data?.comment);
    logger.info('WorkflowService', `审批拒绝: 工作流 ID ${workflowId}, 审批人 ID: ${userId}`);
    return result;
}

/**
 * 取消工作流
 */
async function cancelWorkflow(id, userId) {
    const workflowId = parseInt(id, 10);
    const result = await workflowEngine.cancelWorkflow(workflowId, userId);
    logger.info('WorkflowService', `取消工作流: 工作流 ID ${workflowId}`);
    return result;
}

/**
 * 获取用户待办列表
 */
async function getUserTodoList(userId) {
    const todos = await prisma.approvalNode.findMany({
        where: {
            approverId: userId,
            status: 'PENDING',
            workflow: { status: 'PENDING' },
        },
        include: {
            workflow: {
                include: {
                    template: { select: { name: true } },
                    applicant: {
                        select: {
                            username: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    project: { select: { projectName: true } },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return todos.map((node) => ({
        nodeId: node.id,
        workflowId: node.workflowId,
        type: node.workflow.type,
        template: node.workflow.template.name,
        applicant: node.workflow.applicant.profile?.fullName || node.workflow.applicant.username,
        project: node.workflow.project?.projectName,
        createdAt: node.workflow.createdAt,
    }));
}

/**
 * 获取工作流统计
 */
async function getWorkflowStats() {
    const [total, pending, approved, rejected] = await Promise.all([
        prisma.workflowInstance.count(),
        prisma.workflowInstance.count({ where: { status: 'PENDING' } }),
        prisma.workflowInstance.count({ where: { status: 'APPROVED' } }),
        prisma.workflowInstance.count({ where: { status: 'REJECTED' } }),
    ]);

    return { total, pending, approved, rejected };
}

module.exports = {
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    approveWorkflow,
    rejectWorkflow,
    cancelWorkflow,
    getUserTodoList,
    getWorkflowStats,
};
