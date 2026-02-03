/**
 * 全局错误处理中间件
 */

/**
 * 自定义应用错误类
 */
class AppError extends Error {
    constructor(message, statusCode, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || '服务器内部错误';
    let code = err.code || 'INTERNAL_ERROR';

    // Prisma 错误处理
    if (err.code === 'P2002') {
        statusCode = 409;
        message = '数据已存在，请检查唯一字段';
        code = 'DUPLICATE_ENTRY';
    } else if (err.code === 'P2025') {
        statusCode = 404;
        message = '请求的数据不存在';
        code = 'NOT_FOUND';
    }

    // JWT 错误处理
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = '无效的认证令牌';
        code = 'INVALID_TOKEN';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = '认证令牌已过期';
        code = 'TOKEN_EXPIRED';
    }

    // 开发环境输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
        console.error('错误详情:', {
            message: err.message,
            stack: err.stack,
            code: err.code,
        });
    }

    res.status(statusCode).json({
        success: false,
        code,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

/**
 * 异步错误捕获包装器
 * 用于包装异步路由处理函数，自动捕获错误并传递给错误处理中间件
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler,
};
