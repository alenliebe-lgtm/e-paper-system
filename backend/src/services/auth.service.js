/**
 * 认证服务
 * 处理用户登录、注册、令牌管理等业务逻辑
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 * @returns {Object} 创建的用户信息
 */
async function register(userData) {
    const { username, email, password, roleId } = userData;

    // 检查用户名是否已存在
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username },
                { email },
            ],
        },
    });

    if (existingUser) {
        if (existingUser.username === username) {
            throw new AppError('用户名已被使用', 409, 'USERNAME_EXISTS');
        }
        throw new AppError('邮箱已被使用', 409, 'EMAIL_EXISTS');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 获取默认角色（Staff）
    let finalRoleId = roleId;
    if (!finalRoleId) {
        const staffRole = await prisma.role.findUnique({
            where: { name: 'Staff' },
        });
        finalRoleId = staffRole?.id || 3; // 默认 Staff 角色
    }

    // 创建用户
    const user = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            roleId: finalRoleId,
            status: 'ACTIVE',
        },
        include: {
            role: true,
        },
    });

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        status: user.status,
        createdAt: user.createdAt,
    };
}

/**
 * 用户登录
 * @param {string} username - 用户名或邮箱
 * @param {string} password - 密码
 * @returns {Object} 登录结果（包含令牌）
 */
async function login(username, password) {
    // 查找用户（支持用户名或邮箱登录）
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { username },
                { email: username },
            ],
        },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
        throw new AppError('账号已被停用或待激活', 403, 'ACCOUNT_INACTIVE');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AppError('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
    }

    // 生成令牌
    const tokens = generateTokens(user);

    // 提取权限
    const permissions = user.role.permissions.map(rp => rp.permission.code);

    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name,
            permissions,
        },
        ...tokens,
    };
}

/**
 * 刷新访问令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {Object} 新的令牌对
 */
async function refreshToken(refreshToken) {
    try {
        // 验证刷新令牌
        const decoded = jwt.verify(refreshToken, config.jwt.secret);

        if (decoded.type !== 'refresh') {
            throw new AppError('无效的刷新令牌', 401, 'INVALID_REFRESH_TOKEN');
        }

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true },
        });

        if (!user || user.status !== 'ACTIVE') {
            throw new AppError('用户不存在或已被停用', 401, 'USER_INVALID');
        }

        // 生成新令牌
        return generateTokens(user);
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError('刷新令牌无效或已过期', 401, 'REFRESH_TOKEN_EXPIRED');
    }
}

/**
 * 生成访问令牌和刷新令牌
 * @param {Object} user - 用户对象
 * @returns {Object} 令牌对
 */
function generateTokens(user) {
    // 访问令牌
    const accessToken = jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role.name,
            type: 'access',
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );

    // 刷新令牌
    const refreshToken = jwt.sign(
        {
            userId: user.id,
            type: 'refresh',
        },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );

    return {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn,
    };
}

/**
 * 修改密码
 * @param {number} userId - 用户 ID
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 */
async function changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw new AppError('原密码错误', 401, 'INVALID_PASSWORD');
    }

    // 更新密码
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });
}

/**
 * 获取当前用户信息
 * @param {number} userId - 用户 ID
 * @returns {Object} 用户信息
 */
async function getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: {
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            },
            profile: true,
        },
    });

    if (!user) {
        throw new AppError('用户不存在', 404, 'USER_NOT_FOUND');
    }

    const permissions = user.role.permissions.map(rp => rp.permission.code);

    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        permissions,
        profile: user.profile,
        status: user.status,
        createdAt: user.createdAt,
    };
}

module.exports = {
    register,
    login,
    refreshToken,
    changePassword,
    getCurrentUser,
};
