/**
 * 员工服务层（重构后）
 * 使用通用分页和辅助函数消除重复代码
 */
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const { paginate } = require('../utils/pagination.helper');
const { findOrFail, parseDateFields } = require('../utils/service.helper');
const logger = require('../utils/logger');

/**
 * 获取员工列表（分页查询）
 */
async function getEmployees(query) {
    const { page = 1, pageSize = 10, department, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // 构建查询条件
    const where = {};
    if (department) where.department = department;
    if (search) {
        where.OR = [
            { fullName: { contains: search, mode: 'insensitive' } },
            { position: { contains: search, mode: 'insensitive' } },
        ];
    }

    return paginate('employeeProfile', {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
            user: { select: { id: true, username: true, email: true } },
        },
    });
}

/**
 * 获取员工详情
 */
async function getEmployeeById(id) {
    return findOrFail('employeeProfile', parseInt(id, 10), {
        errorMsg: '员工不存在',
        errorCode: 'EMPLOYEE_NOT_FOUND',
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: { select: { name: true } },
                },
            },
        },
    });
}

/**
 * 创建员工档案
 */
async function createEmployee(data, userId) {
    // 检查用户是否已有档案
    const existing = await prisma.employeeProfile.findUnique({
        where: { userId },
    });

    if (existing) {
        throw new AppError('该用户已有员工档案', 400, 'EMPLOYEE_EXISTS');
    }

    const employeeData = parseDateFields({ ...data, userId }, ['entryDate', 'exitDate']);

    const employee = await prisma.employeeProfile.create({
        data: employeeData,
        include: {
            user: { select: { id: true, username: true, email: true } },
        },
    });

    logger.info('EmployeeService', `创建员工档案: ${employee.fullName}`);
    return employee;
}

/**
 * 更新员工档案
 */
async function updateEmployee(id, data) {
    const employeeId = parseInt(id, 10);

    // 检查员工是否存在
    await findOrFail('employeeProfile', employeeId, {
        errorMsg: '员工不存在',
        errorCode: 'EMPLOYEE_NOT_FOUND',
    });

    const employeeData = parseDateFields(data, ['entryDate', 'exitDate']);

    const employee = await prisma.employeeProfile.update({
        where: { id: employeeId },
        data: employeeData,
        include: {
            user: { select: { id: true, username: true, email: true } },
        },
    });

    logger.info('EmployeeService', `更新员工档案: ${employee.fullName}`);
    return employee;
}

/**
 * 删除员工档案
 */
async function deleteEmployee(id) {
    const employeeId = parseInt(id, 10);

    // 检查员工是否存在
    await findOrFail('employeeProfile', employeeId, {
        errorMsg: '员工不存在',
        errorCode: 'EMPLOYEE_NOT_FOUND',
    });

    await prisma.employeeProfile.delete({ where: { id: employeeId } });

    logger.info('EmployeeService', `删除员工档案 ID: ${employeeId}`);
    return { message: '员工档案已删除' };
}

/**
 * 获取部门列表
 */
async function getDepartments() {
    const departments = await prisma.employeeProfile.findMany({
        select: { department: true },
        distinct: ['department'],
        orderBy: { department: 'asc' },
    });

    return departments.map((d) => d.department);
}

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDepartments,
};
