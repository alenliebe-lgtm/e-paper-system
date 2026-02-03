/**
 * 模板路由
 * 定义模板管理相关的 API 端点
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { commonValidation } = require('../middlewares/validation.middleware');

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/templates/active
 * @desc    获取活跃模板列表（下拉选择用）
 * @access  Private (template:read)
 */
router.get('/active',
    authorize('template:read'),
    templateController.getActiveTemplates
);

/**
 * @route   GET /api/templates
 * @desc    获取模板列表
 * @access  Private (template:read)
 */
router.get('/',
    authorize('template:read'),
    commonValidation.pagination,
    templateController.getTemplates
);

/**
 * @route   GET /api/templates/:id
 * @desc    获取模板详情
 * @access  Private (template:read)
 */
router.get('/:id',
    authorize('template:read'),
    commonValidation.idParam,
    templateController.getTemplateById
);

/**
 * @route   POST /api/templates
 * @desc    创建模板
 * @access  Private (template:write)
 */
router.post('/',
    authorize('template:write'),
    templateController.createTemplate
);

/**
 * @route   PUT /api/templates/:id
 * @desc    更新模板
 * @access  Private (template:write)
 */
router.put('/:id',
    authorize('template:write'),
    commonValidation.idParam,
    templateController.updateTemplate
);

/**
 * @route   POST /api/templates/:id/deactivate
 * @desc    停用模板
 * @access  Private (template:write)
 */
router.post('/:id/deactivate',
    authorize('template:write'),
    commonValidation.idParam,
    templateController.deactivateTemplate
);

/**
 * @route   POST /api/templates/:id/activate
 * @desc    启用模板
 * @access  Private (template:write)
 */
router.post('/:id/activate',
    authorize('template:write'),
    commonValidation.idParam,
    templateController.activateTemplate
);

module.exports = router;
