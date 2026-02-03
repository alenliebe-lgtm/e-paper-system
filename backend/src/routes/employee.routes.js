/**
 * 员工路由
 * 定义员工管理相关的 API 端点
 */

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { employeeValidation, commonValidation } = require('../middlewares/validation.middleware');

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/employees/departments
 * @desc    获取部门列表
 * @access  Private
 */
router.get('/departments', employeeController.getDepartments);

/**
 * @route   GET /api/employees
 * @desc    获取员工列表
 * @access  Private (employee:read)
 */
router.get('/',
    authorize('employee:read'),
    commonValidation.pagination,
    employeeController.getEmployees
);

/**
 * @route   GET /api/employees/:id
 * @desc    获取员工详情
 * @access  Private (employee:read)
 */
router.get('/:id',
    authorize('employee:read'),
    commonValidation.idParam,
    employeeController.getEmployeeById
);

/**
 * @route   POST /api/employees
 * @desc    创建员工档案
 * @access  Private (employee:write)
 */
router.post('/',
    authorize('employee:write'),
    employeeValidation.create,
    employeeController.createEmployee
);

/**
 * @route   PUT /api/employees/:id
 * @desc    更新员工档案
 * @access  Private (employee:write)
 */
router.put('/:id',
    authorize('employee:write'),
    employeeValidation.update,
    employeeController.updateEmployee
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    删除员工档案
 * @access  Private (employee:delete)
 */
router.delete('/:id',
    authorize('employee:delete'),
    commonValidation.idParam,
    employeeController.deleteEmployee
);

module.exports = router;
