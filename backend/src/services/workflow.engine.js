/**
 * 工作流引擎
 * 基于状态机实现 On-board / Off-board 流程逻辑
 */

const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 工作流状态定义
 */
const WORKFLOW_STATES = {
    PENDING: 'PENDING',     // 待处理
    APPROVED: 'APPROVED',   // 已通过
    REJECTED: 'REJECTED',   // 已拒绝
    CANCELLED: 'CANCELLED', // 已取消
};

/**
 * 审批节点状态定义
 */
const APPROVAL_STATES = {
    PENDING: 'PENDING',   // 待审批
    APPROVED: 'APPROVED', // 已通过
    REJECTED: 'REJECTED', // 已拒绝
    SKIPPED: 'SKIPPED',   // 已跳过
};

/**
 * 工作流引擎类
 */
class WorkflowEngine {
    /**
     * 创建工作流实例
     * @param {Object} params - 创建参数
     * @returns {Object} 创建的工作流实例
     */
    async createInstance(params) {
        const { templateId, applicantId, projectId, type, remark } = params;

        // 获取模板
        const template = await prisma.template.findUnique({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError('模板不存在', 404, 'TEMPLATE_NOT_FOUND');
        }

        if (!template.isActive) {
            throw new AppError('模板已停用', 400, 'TEMPLATE_INACTIVE');
        }

        // 从模板内容获取审批步骤
        const approvalSteps = template.content.approvalSteps || [];

        // 创建工作流实例
        const workflow = await prisma.workflowInstance.create({
            data: {
                templateId,
                applicantId,
                projectId,
                type,
                remark,
                currentStep: 1,
                status: WORKFLOW_STATES.PENDING,
            },
            include: {
                template: true,
                applicant: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        // 根据模板创建审批节点
        for (const step of approvalSteps) {
            // 根据角色找到审批人
            const approvers = await this.findApproversByRole(step.role);

            if (approvers.length > 0) {
                // 为每个审批人创建审批节点
                await prisma.approvalNode.create({
                    data: {
                        workflowId: workflow.id,
                        stepOrder: step.step,
                        approverId: approvers[0].id, // 默认使用第一个符合条件的审批人
                        status: APPROVAL_STATES.PENDING,
                    },
                });
            }
        }

        // 记录审计日志
        await this.logAction(workflow.id, applicantId, 'CREATE', {
            type,
            templateId,
            projectId,
        });

        return workflow;
    }

    /**
     * 根据角色查找审批人
     * @param {string} roleName - 角色名称
     * @returns {Array} 审批人列表
     */
    async findApproversByRole(roleName) {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    name: roleName,
                },
                status: 'ACTIVE',
            },
            select: {
                id: true,
                username: true,
            },
        });

        return users;
    }

    /**
     * 审批通过
     * @param {number} workflowId - 工作流 ID
     * @param {number} approverId - 审批人 ID
     * @param {string} comment - 审批意见
     * @returns {Object} 更新后的工作流
     */
    async approve(workflowId, approverId, comment = '') {
        const workflow = await this.getWorkflowWithNodes(workflowId);

        // 验证工作流状态
        if (workflow.status !== WORKFLOW_STATES.PENDING) {
            throw new AppError('工作流已结束，无法审批', 400, 'WORKFLOW_ENDED');
        }

        // 查找当前待审批节点
        const currentNode = this.getCurrentApprovalNode(workflow, approverId);

        if (!currentNode) {
            throw new AppError('没有权限审批此工作流', 403, 'NO_APPROVAL_PERMISSION');
        }

        // 更新审批节点状态
        await prisma.approvalNode.update({
            where: { id: currentNode.id },
            data: {
                status: APPROVAL_STATES.APPROVED,
                comment,
                approvedAt: new Date(),
            },
        });

        // 检查是否还有下一步
        const hasNextStep = await this.hasNextStep(workflow);

        if (hasNextStep) {
            // 进入下一步
            await prisma.workflowInstance.update({
                where: { id: workflowId },
                data: {
                    currentStep: workflow.currentStep + 1,
                },
            });
        } else {
            // 所有步骤完成，工作流通过
            await prisma.workflowInstance.update({
                where: { id: workflowId },
                data: {
                    status: WORKFLOW_STATES.APPROVED,
                },
            });

            // 执行后续操作（如授权、撤销权限等）
            await this.executePostApprovalActions(workflow);
        }

        // 记录审计日志
        await this.logAction(workflowId, approverId, 'APPROVE', {
            step: currentNode.stepOrder,
            comment,
        });

        return this.getWorkflowWithNodes(workflowId);
    }

    /**
     * 审批拒绝
     * @param {number} workflowId - 工作流 ID
     * @param {number} approverId - 审批人 ID
     * @param {string} comment - 拒绝原因
     * @returns {Object} 更新后的工作流
     */
    async reject(workflowId, approverId, comment = '') {
        const workflow = await this.getWorkflowWithNodes(workflowId);

        // 验证工作流状态
        if (workflow.status !== WORKFLOW_STATES.PENDING) {
            throw new AppError('工作流已结束，无法审批', 400, 'WORKFLOW_ENDED');
        }

        // 查找当前待审批节点
        const currentNode = this.getCurrentApprovalNode(workflow, approverId);

        if (!currentNode) {
            throw new AppError('没有权限审批此工作流', 403, 'NO_APPROVAL_PERMISSION');
        }

        // 更新审批节点状态
        await prisma.approvalNode.update({
            where: { id: currentNode.id },
            data: {
                status: APPROVAL_STATES.REJECTED,
                comment,
                approvedAt: new Date(),
            },
        });

        // 工作流被拒绝
        await prisma.workflowInstance.update({
            where: { id: workflowId },
            data: {
                status: WORKFLOW_STATES.REJECTED,
            },
        });

        // 记录审计日志
        await this.logAction(workflowId, approverId, 'REJECT', {
            step: currentNode.stepOrder,
            comment,
        });

        return this.getWorkflowWithNodes(workflowId);
    }

    /**
     * 取消工作流
     * @param {number} workflowId - 工作流 ID
     * @param {number} userId - 操作用户 ID
     * @returns {Object} 更新后的工作流
     */
    async cancel(workflowId, userId) {
        const workflow = await prisma.workflowInstance.findUnique({
            where: { id: workflowId },
        });

        if (!workflow) {
            throw new AppError('工作流不存在', 404, 'WORKFLOW_NOT_FOUND');
        }

        if (workflow.status !== WORKFLOW_STATES.PENDING) {
            throw new AppError('工作流已结束，无法取消', 400, 'WORKFLOW_ENDED');
        }

        // 只有申请人可以取消
        if (workflow.applicantId !== userId) {
            throw new AppError('只有申请人可以取消工作流', 403, 'NOT_APPLICANT');
        }

        const updated = await prisma.workflowInstance.update({
            where: { id: workflowId },
            data: {
                status: WORKFLOW_STATES.CANCELLED,
            },
        });

        // 记录审计日志
        await this.logAction(workflowId, userId, 'CANCEL', {});

        return updated;
    }

    /**
     * 获取工作流及其审批节点
     * @param {number} workflowId - 工作流 ID
     * @returns {Object} 工作流实例
     */
    async getWorkflowWithNodes(workflowId) {
        const workflow = await prisma.workflowInstance.findUnique({
            where: { id: workflowId },
            include: {
                template: true,
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
                approvalNodes: {
                    include: {
                        approver: {
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
                    },
                    orderBy: {
                        stepOrder: 'asc',
                    },
                },
                auditLogs: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 20,
                },
            },
        });

        if (!workflow) {
            throw new AppError('工作流不存在', 404, 'WORKFLOW_NOT_FOUND');
        }

        return workflow;
    }

    /**
     * 获取当前待审批的节点
     * @param {Object} workflow - 工作流实例
     * @param {number} approverId - 审批人 ID
     * @returns {Object|null} 审批节点
     */
    getCurrentApprovalNode(workflow, approverId) {
        return workflow.approvalNodes.find(
            node =>
                node.stepOrder === workflow.currentStep &&
                node.approverId === approverId &&
                node.status === APPROVAL_STATES.PENDING
        );
    }

    /**
     * 检查是否还有下一步
     * @param {Object} workflow - 工作流实例
     * @returns {boolean}
     */
    async hasNextStep(workflow) {
        const nextNode = workflow.approvalNodes.find(
            node => node.stepOrder > workflow.currentStep
        );
        return !!nextNode;
    }

    /**
     * 执行审批通过后的操作
     * @param {Object} workflow - 工作流实例
     */
    async executePostApprovalActions(workflow) {
        // 根据工作流类型执行不同的操作
        if (workflow.type === 'ONBOARD') {
            // 入职流程完成后的操作
            // 例如：更新员工状态、发送通知等
            console.log(`入职流程 ${workflow.id} 已完成`);
        } else if (workflow.type === 'OFFBOARD') {
            // 离职流程完成后的操作
            // 例如：撤销权限、更新员工状态等
            console.log(`离职流程 ${workflow.id} 已完成`);
        }
    }

    /**
     * 记录审计日志
     * @param {number} workflowId - 工作流 ID
     * @param {number} userId - 用户 ID
     * @param {string} action - 操作类型
     * @param {Object} changes - 变更内容
     */
    async logAction(workflowId, userId, action, changes) {
        await prisma.auditLog.create({
            data: {
                workflowId,
                userId,
                action,
                changes,
            },
        });
    }
}

// 导出单例
module.exports = new WorkflowEngine();
