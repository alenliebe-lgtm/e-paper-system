/**
 * 工作流路由
 * 定义工作流相关的 API 端点
 */

const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflow.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { workflowValidation, commonValidation } = require('../middlewares/validation.middleware');

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/workflows/todo
 * @desc    获取当前用户的待办事项
 * @access  Private
 */
router.get('/todo', workflowController.getTodoList);

/**
 * @route   GET /api/workflows/stats
 * @desc    获取工作流统计信息
 * @access  Private (workflow:read)
 */
router.get('/stats',
    authorize('workflow:read'),
    workflowController.getWorkflowStats
);

/**
 * @route   GET /api/workflows
 * @desc    获取工作流列表
 * @access  Private (workflow:read)
 */
router.get('/',
    authorize('workflow:read'),
    commonValidation.pagination,
    workflowController.getWorkflows
);

/**
 * @route   GET /api/workflows/:id
 * @desc    获取工作流详情
 * @access  Private (workflow:read)
 */
router.get('/:id',
    authorize('workflow:read'),
    commonValidation.idParam,
    workflowController.getWorkflowById
);

/**
 * @route   POST /api/workflows
 * @desc    创建工作流（发起审批申请）
 * @access  Private (workflow:write)
 */
router.post('/',
    authorize('workflow:write'),
    workflowValidation.create,
    workflowController.createWorkflow
);

/**
 * @route   POST /api/workflows/:id/approve
 * @desc    审批通过
 * @access  Private (workflow:approve)
 */
router.post('/:id/approve',
    authorize('workflow:approve'),
    workflowValidation.approve,
    workflowController.approveWorkflow
);

/**
 * @route   POST /api/workflows/:id/reject
 * @desc    审批拒绝
 * @access  Private (workflow:approve)
 */
router.post('/:id/reject',
    authorize('workflow:approve'),
    workflowValidation.approve,
    workflowController.rejectWorkflow
);

/**
 * @route   POST /api/workflows/:id/cancel
 * @desc    取消工作流
 * @access  Private
 */
router.post('/:id/cancel',
    commonValidation.idParam,
    workflowController.cancelWorkflow
);

module.exports = router;
