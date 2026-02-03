/**
 * Prisma 客户端单例
 * 确保整个应用只使用一个数据库连接实例
 */

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    // 开发环境下复用连接，避免热重载时创建多个连接
    if (!global.prisma) {
        global.prisma = new PrismaClient({
            log: ['query', 'info', 'warn', 'error'],
        });
    }
    prisma = global.prisma;
}

module.exports = prisma;
