/**
 * 模板控制器
 * 处理模板相关的 HTTP 请求
 */

const templateService = require('../services/template.service');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * 获取模板列表
 * GET /api/templates
 */
const getTemplates = asyncHandler(async (req, res) => {
    const { page, pageSize, type, isActive, keyword, sortBy, sortOrder } = req.query;

    const result = await templateService.getTemplates({
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 10,
        type,
        isActive,
        keyword,
        sortBy,
        sortOrder,
    });

    res.json({
        success: true,
        ...result,
    });
});

/**
 * 获取活跃模板列表（下拉选择用）
 * GET /api/templates/active
 */
const getActiveTemplates = asyncHandler(async (req, res) => {
    const { type } = req.query;

    const templates = await templateService.getActiveTemplates(type);

    res.json({
        success: true,
        data: templates,
    });
});

/**
 * 获取模板详情
 * GET /api/templates/:id
 */
const getTemplateById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const template = await templateService.getTemplateById(parseInt(id, 10));

    res.json({
        success: true,
        data: template,
    });
});

/**
 * 创建模板
 * POST /api/templates
 */
const createTemplate = asyncHandler(async (req, res) => {
    const data = req.body;

    const template = await templateService.createTemplate(data);

    res.status(201).json({
        success: true,
        message: '模板创建成功',
        data: template,
    });
});

/**
 * 更新模板
 * PUT /api/templates/:id
 */
const updateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const template = await templateService.updateTemplate(parseInt(id, 10), data);

    res.json({
        success: true,
        message: '模板更新成功',
        data: template,
    });
});

/**
 * 停用模板
 * POST /api/templates/:id/deactivate
 */
const deactivateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const template = await templateService.deactivateTemplate(parseInt(id, 10));

    res.json({
        success: true,
        message: '模板已停用',
        data: template,
    });
});

/**
 * 启用模板
 * POST /api/templates/:id/activate
 */
const activateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const template = await templateService.activateTemplate(parseInt(id, 10));

    res.json({
        success: true,
        message: '模板已启用',
        data: template,
    });
});

module.exports = {
    getTemplates,
    getActiveTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deactivateTemplate,
    activateTemplate,
};
