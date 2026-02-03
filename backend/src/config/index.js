/**
 * 应用配置文件
 * 统一管理所有环境变量和配置项
 */

require('dotenv').config();

const config = {
    // 服务器配置
    server: {
        port: parseInt(process.env.PORT, 10) || 3001,
        env: process.env.NODE_ENV || 'development',
    },

    // 数据库配置
    database: {
        url: process.env.DATABASE_URL,
    },

    // Redis 配置
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // JWT 配置
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // 文件上传配置
    upload: {
        dir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 默认 10MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    },

    // CORS 配置
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
};

module.exports = config;
