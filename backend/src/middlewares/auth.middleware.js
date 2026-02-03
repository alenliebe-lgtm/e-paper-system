/**
 * 认证中间件
 * JWT 验证和 RBAC 权限校验
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');
const { AppError } = require('./error.middleware');

/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token
 */
const authenticate = async (req, res, next) => {
    try {
        // 获取 Authorization 头
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('请提供认证令牌', 401, 'UNAUTHORIZED');
        }

        // 提取 token
        const token = authHeader.split(' ')[1];

        // 验证 token
        const decoded = jwt.verify(token, config.jwt.secret);

        // 查询用户信息
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
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
            throw new AppError('用户不存在', 401, 'USER_NOT_FOUND');
        }

        if (user.status !== 'ACTIVE') {
            throw new AppError('用户账号已被停用', 403, 'ACCOUNT_DISABLED');
        }

        // 提取权限代码列表
        const permissions = user.role.permissions.map(rp => rp.permission.code);

        // 将用户信息附加到请求对象
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name,
            roleId: user.roleId,
            permissions,
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            next(error);
        } else {
            next(new AppError('认证失败', 401, 'AUTH_FAILED'));
        }
    }
};

/**
 * 权限校验中间件工厂
 * @param {string|string[]} requiredPermissions - 需要的权限代码
 * @returns {Function} Express 中间件
 */
const authorize = (requiredPermissions) => {
    // 转换为数组
    const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

    return (req, res, next) => {
        // 确保已经通过认证
        if (!req.user) {
            return next(new AppError('请先登录', 401, 'UNAUTHORIZED'));
        }

        // 管理员拥有所有权限
        if (req.user.role === 'Admin') {
            return next();
        }

        // 检查是否拥有所需权限之一
        const hasPermission = permissions.some(p => req.user.permissions.includes(p));

        if (!hasPermission) {
            return next(new AppError('没有权限执行此操作', 403, 'FORBIDDEN'));
        }

        next();
    };
};

/**
 * 可选认证中间件
 * 如果提供了 token 则验证，否则继续
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    return authenticate(req, res, next);
};

module.exports = {
    authenticate,
    authorize,
    optionalAuth,
};
