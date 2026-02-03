/**
 * 员工控制器
 * 处理员工相关的 HTTP 请求
 */

const employeeService = require('../services/employee.service');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * 获取员工列表
 * GET /api/employees
 */
const getEmployees = asyncHandler(async (req, res) => {
    const { page, pageSize, department, keyword, sortBy, sortOrder } = req.query;

    const result = await employeeService.getEmployees({
        page: parseInt(page, 10) || 1,
        pageSize: parseInt(pageSize, 10) || 10,
        department,
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
 * 获取员工详情
 * GET /api/employees/:id
 */
const getEmployeeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const employee = await employeeService.getEmployeeById(parseInt(id, 10));

    res.json({
        success: true,
        data: employee,
    });
});

/**
 * 创建员工档案
 * POST /api/employees
 */
const createEmployee = asyncHandler(async (req, res) => {
    const { userId, ...data } = req.body;

    // 如果没有指定 userId，使用当前登录用户
    const targetUserId = userId || req.user.id;

    const employee = await employeeService.createEmployee(data, targetUserId);

    res.status(201).json({
        success: true,
        message: '员工档案创建成功',
        data: employee,
    });
});

/**
 * 更新员工档案
 * PUT /api/employees/:id
 */
const updateEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const employee = await employeeService.updateEmployee(parseInt(id, 10), data);

    res.json({
        success: true,
        message: '员工档案更新成功',
        data: employee,
    });
});

/**
 * 删除员工档案
 * DELETE /api/employees/:id
 */
const deleteEmployee = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await employeeService.deleteEmployee(parseInt(id, 10));

    res.json({
        success: true,
        message: '员工档案删除成功',
    });
});

/**
 * 获取部门列表
 * GET /api/employees/departments
 */
const getDepartments = asyncHandler(async (req, res) => {
    const departments = await employeeService.getDepartments();

    res.json({
        success: true,
        data: departments,
    });
});

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDepartments,
};
