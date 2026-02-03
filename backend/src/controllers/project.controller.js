/**
 * 项目控制器
 * 处理项目相关的 HTTP 请求
 */

const projectService = require('../services/project.service');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * 获取项目列表
 * GET /api/projects
 */
const getProjects = asyncHandler(async (req, res) => {
    const { page, pageSize, status, pmId, keyword, sortBy, sortOrder } = req.query;

    const result = await projectService.getProjects({
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 10,
        status,
        pmId,
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
 * 获取项目详情
 * GET /api/projects/:id
 */
const getProjectById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const project = await projectService.getProjectById(parseInt(id, 10));

    res.json({
        success: true,
        data: project,
    });
});

/**
 * 创建项目
 * POST /api/projects
 */
const createProject = asyncHandler(async (req, res) => {
    const data = req.body;

    const project = await projectService.createProject(data);

    res.status(201).json({
        success: true,
        message: '项目创建成功',
        data: project,
    });
});

/**
 * 更新项目
 * PUT /api/projects/:id
 */
const updateProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const project = await projectService.updateProject(parseInt(id, 10), data);

    res.json({
        success: true,
        message: '项目更新成功',
        data: project,
    });
});

/**
 * 删除项目
 * DELETE /api/projects/:id
 */
const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await projectService.deleteProject(parseInt(id, 10));

    res.json({
        success: true,
        message: '项目删除成功',
    });
});

/**
 * 获取项目统计信息
 * GET /api/projects/stats
 */
const getProjectStats = asyncHandler(async (req, res) => {
    const stats = await projectService.getProjectStats();

    res.json({
        success: true,
        data: stats,
    });
});

module.exports = {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats,
};
