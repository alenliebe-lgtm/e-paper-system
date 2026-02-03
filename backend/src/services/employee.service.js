/**
 * 员工服务
 * 处理员工档案相关的业务逻辑
 */

const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 获取员工列表（分页）
 * @param {Object} options - 查询选项
 * @returns {Object} 分页结果
 */
async function getEmployees(options = {}) {
    const {
        page = 1,
        pageSize = 10,
        department,
        keyword,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where = {};

    if (department) {
        where.department = department;
    }

    if (keyword) {
        where.OR = [
            { fullName: { contains: keyword, mode: 'insensitive' } },
            { position: { contains: keyword, mode: 'insensitive' } },
        ];
    }

    // 查询数据
    const [employees, total] = await Promise.all([
        prisma.employeeProfile.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.employeeProfile.count({ where }),
    ]);

    return {
        data: employees,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

/**
 * 获取员工详情
 * @param {number} id - 员工 ID
 * @returns {Object} 员工信息
 */
async function getEmployeeById(id) {
    const employee = await prisma.employeeProfile.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    status: true,
                    role: true,
                },
            },
        },
    });

    if (!employee) {
        throw new AppError('员工不存在', 404, 'EMPLOYEE_NOT_FOUND');
    }

    return employee;
}

/**
 * 创建员工档案
 * @param {Object} data - 员工数据
 * @param {number} userId - 关联的用户 ID
 * @returns {Object} 创建的员工信息
 */
async function createEmployee(data, userId) {
    // 检查用户是否已有档案
    const existingProfile = await prisma.employeeProfile.findUnique({
        where: { userId },
    });

    if (existingProfile) {
        throw new AppError('该用户已有员工档案', 409, 'PROFILE_EXISTS');
    }

    const employee = await prisma.employeeProfile.create({
        data: {
            ...data,
            userId,
            entryDate: new Date(data.entryDate),
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
        },
    });

    return employee;
}

/**
 * 更新员工档案
 * @param {number} id - 员工 ID
 * @param {Object} data - 更新数据
 * @returns {Object} 更新后的员工信息
 */
async function updateEmployee(id, data) {
    // 检查员工是否存在
    const existing = await prisma.employeeProfile.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError('员工不存在', 404, 'EMPLOYEE_NOT_FOUND');
    }

    // 处理日期字段
    if (data.entryDate) {
        data.entryDate = new Date(data.entryDate);
    }

    const employee = await prisma.employeeProfile.update({
        where: { id },
        data,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
        },
    });

    return employee;
}

/**
 * 删除员工档案
 * @param {number} id - 员工 ID
 */
async function deleteEmployee(id) {
    const existing = await prisma.employeeProfile.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError('员工不存在', 404, 'EMPLOYEE_NOT_FOUND');
    }

    await prisma.employeeProfile.delete({
        where: { id },
    });
}

/**
 * 获取部门列表
 * @returns {Array} 部门列表
 */
async function getDepartments() {
    const departments = await prisma.employeeProfile.findMany({
        select: {
            department: true,
        },
        distinct: ['department'],
    });

    return departments.map(d => d.department);
}

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getDepartments,
};
