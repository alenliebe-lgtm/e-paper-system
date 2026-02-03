/**
 * 工作流控制器
 * 处理工作流相关的 HTTP 请求
 */

const workflowService = require('../services/workflow.service');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * 获取工作流列表
 * GET /api/workflows
 */
const getWorkflows = asyncHandler(async (req, res) => {
    const { page, pageSize, type, status, applicantId, projectId, sortBy, sortOrder } = req.query;

    const result = await workflowService.getWorkflows({
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 10,
        type,
        status,
        applicantId,
        projectId,
        sortBy,
        sortOrder,
    });

    res.json({
        success: true,
        ...result,
    });
});

/**
 * 获取工作流详情
 * GET /api/workflows/:id
 */
const getWorkflowById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const workflow = await workflowService.getWorkflowById(parseInt(id, 10));

    res.json({
        success: true,
        data: workflow,
    });
});

/**
 * 创建工作流
 * POST /api/workflows
 */
const createWorkflow = asyncHandler(async (req, res) => {
    const data = req.body;
    const applicantId = req.user.id;

    const workflow = await workflowService.createWorkflow(data, applicantId);

    res.status(201).json({
        success: true,
        message: '工作流创建成功',
        data: workflow,
    });
});

/**
 * 审批通过
 * POST /api/workflows/:id/approve
 */
const approveWorkflow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id;

    const workflow = await workflowService.approveWorkflow(
        parseInt(id, 10),
        approverId,
        comment
    );

    res.json({
        success: true,
        message: '审批通过',
        data: workflow,
    });
});

/**
 * 审批拒绝
 * POST /api/workflows/:id/reject
 */
const rejectWorkflow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const approverId = req.user.id;

    const workflow = await workflowService.rejectWorkflow(
        parseInt(id, 10),
        approverId,
        comment
    );

    res.json({
        success: true,
        message: '审批已拒绝',
        data: workflow,
    });
});

/**
 * 取消工作流
 * POST /api/workflows/:id/cancel
 */
const cancelWorkflow = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const workflow = await workflowService.cancelWorkflow(parseInt(id, 10), userId);

    res.json({
        success: true,
        message: '工作流已取消',
        data: workflow,
    });
});

/**
 * 获取待办事项
 * GET /api/workflows/todo
 */
const getTodoList = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const todos = await workflowService.getTodoList(userId);

    res.json({
        success: true,
        data: todos,
    });
});

/**
 * 获取工作流统计
 * GET /api/workflows/stats
 */
const getWorkflowStats = asyncHandler(async (req, res) => {
    const stats = await workflowService.getWorkflowStats();

    res.json({
        success: true,
        data: stats,
    });
});

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
