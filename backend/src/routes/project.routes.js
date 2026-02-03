/**
 * 项目路由
 * 定义项目管理相关的 API 端点
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { projectValidation, commonValidation } = require('../middlewares/validation.middleware');

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/projects/stats
 * @desc    获取项目统计信息
 * @access  Private (project:read)
 */
router.get('/stats',
    authorize('project:read'),
    projectController.getProjectStats
);

/**
 * @route   GET /api/projects
 * @desc    获取项目列表
 * @access  Private (project:read)
 */
router.get('/',
    authorize('project:read'),
    commonValidation.pagination,
    projectController.getProjects
);

/**
 * @route   GET /api/projects/:id
 * @desc    获取项目详情
 * @access  Private (project:read)
 */
router.get('/:id',
    authorize('project:read'),
    commonValidation.idParam,
    projectController.getProjectById
);

/**
 * @route   POST /api/projects
 * @desc    创建项目
 * @access  Private (project:write)
 */
router.post('/',
    authorize('project:write'),
    projectValidation.create,
    projectController.createProject
);

/**
 * @route   PUT /api/projects/:id
 * @desc    更新项目
 * @access  Private (project:write)
 */
router.put('/:id',
    authorize('project:write'),
    projectValidation.update,
    projectController.updateProject
);

/**
 * @route   DELETE /api/projects/:id
 * @desc    删除项目
 * @access  Private (project:delete)
 */
router.delete('/:id',
    authorize('project:delete'),
    commonValidation.idParam,
    projectController.deleteProject
);

module.exports = router;
